/* eslint-disable prettier/prettier */
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { LineService } from './line.service.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhookEvent, MessageEvent } from '@line/bot-sdk';

@ApiTags('Line Webhook')
@Controller('line')
export class LineController {
  constructor(private readonly lineService: LineService) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'LINE Webhook for receiving messages' })
  async handleWebhook(@Body() body: { events: WebhookEvent[] }) {
    const events = body.events || [];

    for (const event of events) {
      if (
        event.type === 'message' &&
        event.message.type === 'text' &&
        event.source.userId
      ) {
        const userId = event.source.userId;
        const replyToken = event.replyToken;
        const text = event.message.text.trim().toLowerCase();

        if (text === 'id' || text === 'ไอดี') {
          await this.lineService.replyMessage(
            replyToken,
            `รหัส User ID ของคุณคือ:\n${userId}\n\nนำรหัสนี้ไปใส่ในโปรไฟล์เพื่อรับแจ้งเตือนครับ`,
          );
        } else {
          await this.lineService.replyMessage(
            replyToken,
            `สวัสดีครับ! พิมพ์ "ID" หรือ "ไอดี" เพื่อดูรหัส User ID ของคุณสำหรับการรับแจ้งเตือนครับ`,
          );
        }
      }
    }

    return { status: 'success' };
  }
}
