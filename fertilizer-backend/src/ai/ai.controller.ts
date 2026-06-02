import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) { }

  /**
   * 💬 API สำหรับ Chatbot บนฝั่งผู้ดูแลระบบ (Admin Dashboard)
   */
  @Post('chat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async chat(@Body() body: { message: string }) {
    const reply = await this.aiService.getAnswer(body.message);
    return { reply };
  }

  /**
   * 🤖 Webhook สำหรับรับข้อความและตอบกลับจาก LINE Official Account (LINE Bot)
   */
  @Post('line-webhook')
  @HttpCode(200)
  async lineWebhook(@Body() body: any) {
    if (!body || !body.events || body.events.length === 0) {
      return { status: 'no events' };
    }

    for (const event of body.events) {
      // ตรวจสอบว่าเป็นประเภทข้อความตัวหนังสือธรรมดา
      if (event.type === 'message' && event.message && event.message.type === 'text') {
        const userMessage = event.message.text;
        const replyToken = event.replyToken;

        // ดึงคำตอบจาก Smart AI Service ของเรา (เชื่อมโยงฐานข้อมูล)
        const aiAnswer = await this.aiService.getAnswer(userMessage);

        // ส่งสัญญาณข้อความโต้ตอบกลับผ่านท่อสื่อสาร LINE Reply API
        await this.replyToLine(replyToken, aiAnswer);
      }
    }

    return { status: 'success' };
  }

  /**
   * ฟังก์ชันช่วยส่งข้อความตอบกลับตรงไปยัง LINE API
   */
  private async replyToLine(replyToken: string, replyText: string) {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) {
      console.warn('⚠️ [LINE Webhook] ยังไม่ได้กำหนดคีย์ LINE_CHANNEL_ACCESS_TOKEN ในไฟล์ .env');
      return;
    }

    try {
      const response = await fetch('https://api.line.me/v2/bot/message/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          replyToken,
          messages: [
            {
              type: 'text',
              text: replyText,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [LINE Webhook Reply Error] ยิงตอบกลับล้มเหลว:', errorData);
      } else {
        console.log('🟢 [LINE Webhook Reply] บอตร้านปุ๋ยทำการตอบกลับเรียบร้อยแล้ว!');
      }
    } catch (error) {
      console.error('❌ [LINE Webhook Error] เกิดข้อผิดพลาดทางเทคนิคในการเชื่อมต่อ:', error);
    }
  }
}
