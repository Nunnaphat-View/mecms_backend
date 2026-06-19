import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw } from 'typeorm';
import { Equipment } from '../equipment/equipment.entity.js';
import { Task } from '../task/task.entity.js';
import { LineService } from '../line/line.service.js';
import { FlexContainer } from '@line/bot-sdk';
import { NotificationLog } from './notification-log.entity.js';
import { User } from '../user/user.entity.js';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepo: Repository<NotificationLog>,
    private readonly lineService: LineService,
  ) {}

  @Cron('30 7 * * *') // 14:30 Thailand time (UTC+7 = 07:30 UTC)
  async handleCalibrationDueNotifications() {
    this.logger.log('Running scheduled calibration due notifications check...');

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);
    const dateStr = targetDate.toISOString().split('T')[0];

    // Find high-risk equipment due in 7 days
    const dueEquipments = await this.equipmentRepo.find({
      where: {
        calibration_due_date: Raw((alias) => `${alias} = :dateStr`, {
          dateStr,
        }),
        risk_level: 'high',
      },
      relations: ['section'],
    });

    if (dueEquipments.length === 0) {
      this.logger.log('No high-risk equipment due in 7 days found.');
      return;
    }

    this.logger.log(
      `Found ${dueEquipments.length} high-risk equipments due in 7 days.`,
    );

    // Find all admin users to notify
    const admins = await this.equipmentRepo.manager.find(User, {
      where: { role: { name: 'admin' } },
    });
    const adminLineUserIds = admins
      .map((admin) => admin.lineUserId)
      .filter((id) => !!id);

    if (adminLineUserIds.length === 0) {
      this.logger.warn('No admin users with a lineUserId found.');
      return;
    }

    // Group due equipments by tool_name and sectionId
    const groups: {
      [key: string]: {
        tool_name: string;
        sectionId: number | null;
        equipments: Equipment[];
      };
    } = {};

    for (const eq of dueEquipments) {
      const key = `${eq.tool_name || ''}_${eq.sectionId || 0}`;
      if (!groups[key]) {
        groups[key] = {
          tool_name: eq.tool_name,
          sectionId: eq.sectionId,
          equipments: [],
        };
      }
      groups[key].equipments.push(eq);
    }

    for (const key of Object.keys(groups)) {
      const group = groups[key];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Filter out equipment already notified in last 30 days
      const pendingEquipments: Equipment[] = [];
      for (const eq of group.equipments) {
        const alreadySent = await this.notificationLogRepo.findOne({
          where: {
            notificationType: 'CALIBRATION_DUE_7_DAYS',
            equipmentId: eq.id,
            status: 'sent',
            createdAt: Raw((alias) => `${alias} >= :thirtyDaysAgo`, {
              thirtyDaysAgo,
            }),
          },
        });

        if (!alreadySent) {
          pendingEquipments.push(eq);
        } else {
          this.logger.log(
            `Notification 'CALIBRATION_DUE_7_DAYS' already sent for equipment ${eq.tool_name} (ID: ${eq.id}) on ${alreadySent.sentAt ? alreadySent.sentAt.toISOString() : 'N/A'}. Skipping in group.`,
          );
        }
      }

      if (pendingEquipments.length === 0) {
        continue;
      }

      const firstEq = pendingEquipments[0];

      const flexContent: FlexContainer = {
        type: 'bubble',
        size: 'kilo',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#0F172A',
          paddingTop: 'xl',
          paddingBottom: 'lg',
          paddingStart: 'xl',
          paddingEnd: 'xl',
          contents: [
            {
              type: 'text',
              text: '🔔  ระบบแจ้งเตือน',
              color: '#94A3B8',
              size: 'xs',
              weight: 'bold',
            },
            {
              type: 'text',
              text: 'ครบกำหนดสอบเทียบ',
              color: '#FFFFFF',
              size: 'xl',
              weight: 'bold',
              margin: 'sm',
            },
          ],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          paddingTop: 'lg',
          paddingBottom: 'lg',
          paddingStart: 'xl',
          paddingEnd: 'xl',
          spacing: 'lg',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              spacing: 'sm',
              contents: [
                {
                  type: 'box',
                  layout: 'vertical',
                  flex: 1,
                  backgroundColor: '#FEF2F2',
                  cornerRadius: 'sm',
                  paddingTop: 'sm',
                  paddingBottom: 'sm',
                  paddingStart: 'sm',
                  paddingEnd: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: '⚠️  HIGH RISK',
                      color: '#DC2626',
                      size: 'xxs',
                      weight: 'bold',
                      align: 'center',
                    },
                  ],
                },
                {
                  type: 'box',
                  layout: 'vertical',
                  flex: 1,
                  backgroundColor: '#EFF6FF',
                  cornerRadius: 'sm',
                  paddingTop: 'sm',
                  paddingBottom: 'sm',
                  paddingStart: 'sm',
                  paddingEnd: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: `${pendingEquipments.length}  เครื่อง`,
                      color: '#1D4ED8',
                      size: 'xxs',
                      weight: 'bold',
                      align: 'center',
                    },
                  ],
                },
                {
                  type: 'box',
                  layout: 'vertical',
                  flex: 1,
                  backgroundColor: '#FFF7ED',
                  cornerRadius: 'sm',
                  paddingTop: 'sm',
                  paddingBottom: 'sm',
                  paddingStart: 'sm',
                  paddingEnd: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: '7  วันข้างหน้า',
                      color: '#EA580C',
                      size: 'xxs',
                      weight: 'bold',
                      align: 'center',
                    },
                  ],
                },
              ],
            },
            {
              type: 'text',
              text: firstEq.tool_name,
              weight: 'bold',
              size: 'xxl',
              color: '#0F172A',
              wrap: true,
            },
            {
              type: 'box',
              layout: 'vertical',
              spacing: 'xs',
              contents: [
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    {
                      type: 'text',
                      text: 'แผนก',
                      color: '#94A3B8',
                      size: 'sm',
                      flex: 2,
                    },
                    {
                      type: 'text',
                      text: firstEq.section?.name || '-',
                      color: '#1E293B',
                      size: 'sm',
                      weight: 'bold',
                      flex: 4,
                      wrap: true,
                    },
                  ],
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    {
                      type: 'text',
                      text: 'ครบกำหนด',
                      color: '#94A3B8',
                      size: 'sm',
                      flex: 2,
                    },
                    {
                      type: 'text',
                      text: dateStr,
                      color: '#DC2626',
                      size: 'sm',
                      weight: 'bold',
                      flex: 4,
                    },
                  ],
                },
              ],
            },
            {
              type: 'box',
              layout: 'vertical',
              backgroundColor: '#F8FAFC',
              cornerRadius: 'md',
              paddingTop: 'md',
              paddingBottom: 'md',
              paddingStart: 'md',
              paddingEnd: 'md',
              spacing: 'sm',
              contents: [
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    {
                      type: 'text',
                      text: '📋',
                      size: 'sm',
                      flex: 0,
                    },
                    {
                      type: 'text',
                      text: 'รหัสเครื่อง',
                      color: '#64748B',
                      size: 'xs',
                      weight: 'bold',
                      flex: 1,
                      margin: 'sm',
                    },
                  ],
                },
                {
                  type: 'text' as const,
                  text: pendingEquipments
                    .map((e) => e.asset_code || '-')
                    .join('  ·  '),
                  size: 'xs' as const,
                  color: '#334155',
                  wrap: true,
                  weight: 'bold',
                },
              ],
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#0F172A',
          paddingTop: 'md',
          paddingBottom: 'md',
          paddingStart: 'xl',
          paddingEnd: 'xl',
          contents: [
            {
              type: 'text',
              text: 'กรุณาจัดเตรียมแผนการส่งสอบเทียบล่วงหน้า',
              size: 'xs',
              color: '#64748B',
              align: 'center',
            },
          ],
        },
      };

      const altText = `แจ้งเตือน: เครื่องมือ ${firstEq.tool_name} ในแผนก ${firstEq.section?.name || '-'} ใกล้ครบกำหนดสอบเทียบ`;

      // Log the notification as pending for each equipment & admin combination
      const logsToSave: NotificationLog[] = [];
      for (const eq of pendingEquipments) {
        for (const admin of admins) {
          const log = this.notificationLogRepo.create({
            channel: 'line',
            notificationType: 'CALIBRATION_DUE_7_DAYS',
            equipmentId: eq.id,
            userId: admin.id,
            status: 'pending',
          });
          logsToSave.push(log);
        }
      }
      await this.notificationLogRepo.save(logsToSave);

      let sendSuccess = false;
      let errorMessage: string | null = null;

      try {
        // Send to all admins
        await Promise.all(
          adminLineUserIds.map((lineId) =>
            this.lineService.pushFlexMessage(lineId, altText, flexContent),
          ),
        );
        this.logger.log(
          `Notified admins for ${firstEq.tool_name} in section ${firstEq.section?.name || '-'}`,
        );
        sendSuccess = true;
      } catch (error: unknown) {
        errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to notify admins for ${firstEq.tool_name} in section ${firstEq.section?.name || '-'}`,
          error,
        );
      }

      // Update log status
      for (const log of logsToSave) {
        log.status = sendSuccess ? 'sent' : 'failed';
        log.sentAt = sendSuccess ? new Date() : null;
        log.errorMessage = errorMessage;
      }
      await this.notificationLogRepo.save(logsToSave);
    }
  }
}
