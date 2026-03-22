import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Raw } from 'typeorm';
import { Equipment } from '../equipment/equipment.entity.js';
import { Task } from '../task/task.entity.js';
import { LineService } from '../line/line.service.js';
import { FlexContainer } from '@line/bot-sdk';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly lineService: LineService,
  ) {}

  @Cron('0 19 * * *')
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

    for (const eq of dueEquipments) {
      // Find the most recent task for this equipment to identify the technician
      const lastTask = await this.taskRepo.findOne({
        where: { equipment_id: eq.id },
        order: { id: 'DESC' },
        relations: ['technician'],
      });

      const flexContent: FlexContainer = {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'แจ้งเตือน: ครบกำหนดสอบเทียบ',
              color: '#ffffff',
              weight: 'bold',
              size: 'md',
            },
          ],
          backgroundColor: '#ff4b4b',
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: eq.name,
              weight: 'bold',
              size: 'xl',
              margin: 'md',
            },
            {
              type: 'text',
              text: 'ความเสี่ยงสูง (High Risk) เหลืออีก 7 วัน',
              size: 'xs',
              color: '#ff4b4b',
              margin: 'xs',
            },
            {
              type: 'separator',
              margin: 'lg',
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'lg',
              spacing: 'sm',
              contents: [
                {
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: 'รหัสเครื่อง',
                      color: '#aaaaaa',
                      size: 'sm',
                      flex: 2,
                    },
                    {
                      type: 'text',
                      text: eq.asset_code || '-',
                      wrap: true,
                      color: '#666666',
                      size: 'sm',
                      flex: 5,
                    },
                  ],
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: 'รุ่น',
                      color: '#aaaaaa',
                      size: 'sm',
                      flex: 2,
                    },
                    {
                      type: 'text',
                      text: eq.model || '-',
                      wrap: true,
                      color: '#666666',
                      size: 'sm',
                      flex: 5,
                    },
                  ],
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: 'แผนก',
                      color: '#aaaaaa',
                      size: 'sm',
                      flex: 2,
                    },
                    {
                      type: 'text',
                      text: eq.section?.name || '-',
                      wrap: true,
                      color: '#666666',
                      size: 'sm',
                      flex: 5,
                    },
                  ],
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: 'วันครบกำหนด',
                      color: '#aaaaaa',
                      size: 'sm',
                      flex: 2,
                    },
                    {
                      type: 'text',
                      text: dateStr,
                      wrap: true,
                      color: '#ff4b4b',
                      size: 'sm',
                      flex: 5,
                      weight: 'bold',
                    },
                  ],
                },
              ],
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'text',
              text: 'กรุณาเตรียมแผนการสอบเทียบในสัปดาห์หน้า',
              size: 'xs',
              color: '#aaaaaa',
              align: 'center',
            },
          ],
        },
      };

      const altText = `แจ้งเตือน: เครื่องมือ ${eq.name} ใกล้ครบกำหนดสอบเทียบ`;

      if (lastTask?.technician?.lineUserId) {
        // Notify the specific technician
        try {
          await this.lineService.pushFlexMessage(
            lastTask.technician.lineUserId,
            altText,
            flexContent,
          );
          this.logger.log(`Notified technician for equipment ${eq.name}`);
        } catch (error) {
          this.logger.error(
            `Failed to notify technician for equipment ${eq.id}`,
            error,
          );
        }
      } else {
        // No specific technician found... broadcast
        try {
          await this.lineService.broadcastFlexMessage(altText, flexContent);
          this.logger.log(`Broadcasted notification for equipment ${eq.name}`);
        } catch (error) {
          this.logger.error(
            `Failed to broadcast notification for equipment ${eq.id}`,
            error,
          );
        }
      }
    }
  }
}
