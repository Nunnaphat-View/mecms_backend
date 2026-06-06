/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface GroqRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  temperature?: number;
}

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GROQ_API_KEY') || '';
  }

  async generateContent(prompt: string): Promise<string> {
    if (!this.apiKey) {
      this.logger.warn(
        'GROQ_API_KEY is not defined in the environment variables.',
      );
      return 'ไม่สามารถวิเคราะห์แผนงานได้เนื่องจากไม่ได้ตั้งค่า API Key';
    }

    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const body: GroqRequest = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Groq API error status ${response.status}: ${errorText}`,
        );

        try {
          const errObj = JSON.parse(errorText);
          const apiMessage = errObj?.error?.message;
          if (apiMessage) {
            throw new InternalServerErrorException(
              `Groq API Error: ${apiMessage}`,
            );
          }
        } catch (e) {
          if (e instanceof InternalServerErrorException) throw e;
        }

        throw new InternalServerErrorException(
          `การติดต่อกับ Groq API ขัดข้อง (Status ${response.status})`,
        );
      }

      const data = (await response.json()) as GroqResponse;

      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        this.logger.error(
          'Groq API response format is invalid or empty',
          JSON.stringify(data),
        );
        throw new InternalServerErrorException(
          'ผลลัพธ์จาก Groq API ไม่ถูกต้อง',
        );
      }

      return text;
    } catch (error: unknown) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(
        'Failed to generate content from Groq API',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        `ไม่สามารถวิเคราะห์แผนงานได้ในขณะนี้ (${error instanceof Error ? error.message : String(error)})`,
      );
    }
  }
}
