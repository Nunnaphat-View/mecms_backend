/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
  }

  async generateContent(prompt: string): Promise<string> {
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY is not defined in the environment variables.');
      return 'ไม่สามารถวิเคราะห์แผนงานได้เนื่องจากไม่ได้ตั้งค่า API Key';
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;

    const body: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Gemini API error status ${response.status}: ${errorText}`);
        
        try {
          const errObj = JSON.parse(errorText);
          const apiMessage = errObj?.error?.message;
          if (apiMessage) {
            throw new InternalServerErrorException(`Gemini API Error: ${apiMessage}`);
          }
        } catch (e) {
          if (e instanceof InternalServerErrorException) throw e;
        }

        throw new InternalServerErrorException(`การติดต่อกับ Gemini API ขัดข้อง (Status ${response.status})`);
      }

      const data = (await response.json()) as GeminiResponse;

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        this.logger.error('Gemini API response format is invalid or empty', JSON.stringify(data));
        throw new InternalServerErrorException('ผลลัพธ์จาก Gemini API ไม่ถูกต้อง');
      }

      return text;
    } catch (error: unknown) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error('Failed to generate content from Gemini API', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException(`ไม่สามารถวิเคราะห์แผนงานได้ในขณะนี้ (${error instanceof Error ? error.message : String(error)})`);
    }
  }
}
