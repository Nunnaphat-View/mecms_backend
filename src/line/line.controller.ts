import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { LineService } from './line.service.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhookEvent, MessageEvent, FlexContainer } from '@line/bot-sdk';

@ApiTags('Line Webhook')
@Controller('line')
@Public()
export class LineController {
  private readonly logger = new Logger(LineController.name);

  constructor(private readonly lineService: LineService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'LINE Webhook for receiving messages' })
  async handleWebhook(@Body() body: { events: WebhookEvent[] }) {
    this.logger.log(`Received LINE webhook event: ${JSON.stringify(body)}`);
    const events = body.events || [];

    for (const event of events) {
      if (
        event.type === 'message' &&
        event.message.type === 'text' &&
        event.source.userId
      ) {
        const userId = event.source.userId;
        const replyToken = event.replyToken;

        const frontendUrl = this.lineService.getFrontendUrl();

        // Fetch user profile from LINE API to show display name and profile picture on the card
        const profile = await this.lineService.getUserProfile(userId);
        const displayName = profile?.displayName || 'ผู้ใช้งาน LINE';
        const pictureUrl =
          profile?.pictureUrl ||
          'https://cdn-icons-png.flaticon.com/512/149/149071.png';

        const flexContainer: FlexContainer = {
          type: 'bubble',
          size: 'mega',
          body: {
            type: 'box',
            layout: 'vertical',
            paddingAll: '20px',
            spacing: 'md',
            contents: [
              // Header Row
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'MECMS SYSTEM',
                    weight: 'bold',
                    size: 'xs',
                    color: '#088395',
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'box',
                        layout: 'vertical',
                        width: '8px',
                        height: '8px',
                        cornerRadius: '4px',
                        backgroundColor: '#10b981',
                        contents: [],
                      },
                      {
                        type: 'text',
                        text: 'Online',
                        size: 'xxs',
                        color: '#64748b',
                        margin: 'xs',
                        weight: 'bold',
                      },
                    ],
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                  },
                ],
              },
              // Title
              {
                type: 'text',
                text: 'เชื่อมต่อ LINE Notification',
                weight: 'bold',
                size: 'xl',
                color: '#1e293b',
                margin: 'md',
              },
              // Description
              {
                type: 'text',
                text: 'รับการแจ้งเตือนงานสอบเทียบ สถานะเครื่องมือแพทย์ และกำหนดการทำงานผ่านแอปพลิเคชัน LINE',
                size: 'xs',
                color: '#64748b',
                wrap: true,
              },
              // Profile Badge Section
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#f8fafc',
                cornerRadius: 'xl',
                paddingAll: 'md',
                margin: 'md',
                borderColor: '#e2e8f0',
                borderWidth: '1px',
                contents: [
                  {
                    type: 'box',
                    layout: 'horizontal',
                    spacing: 'md',
                    alignItems: 'center',
                    contents: [
                      {
                        type: 'box',
                        layout: 'vertical',
                        width: '44px',
                        height: '44px',
                        cornerRadius: '22px',
                        contents: [
                          {
                            type: 'image',
                            url: pictureUrl,
                            size: 'full',
                            aspectMode: 'cover',
                            aspectRatio: '1:1',
                          },
                        ],
                      },
                      {
                        type: 'box',
                        layout: 'vertical',
                        contents: [
                          {
                            type: 'text',
                            text: 'บัญชี LINE ของคุณ',
                            size: 'xxs',
                            color: '#94a3b8',
                            weight: 'bold',
                          },
                          {
                            type: 'text',
                            text: displayName,
                            weight: 'bold',
                            size: 'sm',
                            color: '#1e293b',
                            margin: 'xs',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              // Button
              {
                type: 'button',
                style: 'primary',
                color: '#10b981',
                height: 'md',
                margin: 'lg',
                action: {
                  type: 'uri',
                  label: '🔗 กดเพื่อเชื่อมต่อบัญชีระบบ',
                  uri: `${frontendUrl}/settings?lineUserId=${userId}`,
                },
              },
              // Footer info
              {
                type: 'text',
                text: 'สิทธิ์การแจ้งเตือนจะผูกกับบัญชีผู้ใช้ที่กำลังล็อกอิน ณ ปัจจุบัน',
                size: 'xxs',
                color: '#94a3b8',
                align: 'center',
                margin: 'md',
                wrap: true,
              },
            ],
          },
        };

        await this.lineService.replyFlexMessage(
          replyToken,
          'เชื่อมต่อแชทบอทเข้ากับบัญชีระบบ',
          flexContainer,
        );
      }
    }

    return { status: 'success' };
  }
}
