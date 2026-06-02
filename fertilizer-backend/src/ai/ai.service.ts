import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { Order } from '../orders/order.entity';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
  ) { }

  /**
   * ระบบหลักสำหรับรับคำถามและส่งคำตอบ (Hybrid Engine)
   */
  async getAnswer(message: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. ดึงข้อมูลสดจากฐานข้อมูล
    const products = await this.productRepo.find();
    const orders = await this.orderRepo.find({ order: { createdAt: 'DESC' } });
    const systemDate = new Date();

    if (apiKey && apiKey !== 'your_key_here' && apiKey.trim() !== '') {
      // 🟢 โหมดอัจฉริยะ: ใช้ Google Gemini 2.5 Flash
      return this.generateGeminiResponse(message, apiKey, products, orders, systemDate);
    } else {
      // 🟡 โหมดธรรมดา: ใช้ระบบประมวลผลกฎอัจฉริยะ (Rule-Based Fallback)
      return this.generateRuleBasedResponse(message, products, orders, systemDate);
    }
  }

  /**
   * 🟢 โหมดอัจฉริยะ - ส่งคุยกับ Gemini 2.5 Flash พร้อมแนบข้อมูลจริงทั้งหมดเป็น Context
   */
  private async generateGeminiResponse(
    message: string,
    apiKey: string,
    products: Product[],
    orders: Order[],
    systemDate: Date,
  ): Promise<string> {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // จัดเวลาปัจจุบันให้อ่านเข้าใจง่าย
      const formattedDate = systemDate.toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // จัดเตรียมประวัติสินค้า
      const productsContext = products
        .map(
          (p) =>
            `- [ID: ${p.id}] ${p.name} | หมวดหมู่: ${p.category} | ราคา: ${Number(p.price)} บาท/กระสอบ | สต๊อกคงเหลือ: ${p.stock} กระสอบ | รายละเอียด: ${p.description || 'ไม่มี'}`,
        )
        .join('\n');

      // จัดเตรียมประวัติออเดอร์
      const ordersContext = orders
        .map((o) => {
          const itemsText = (o.items || [])
            .map((item) => `${item.productName} (x${item.quantity} กระสอบ)`)
            .join(', ');
          return `- [ออเดอร์ #${o.id}] ลูกค้า: ${o.customerName} | เบอร์โทร: ${o.customerPhone} | ยอดรวม: ${Number(o.totalPrice)} บาท | สถานะ: ${o.status} | นัดรับวันที่: ${o.pickupDate || 'ไม่ได้นัด'} เวลา: ${o.pickupTime ? o.pickupTime + ' น.' : 'ไม่ได้นัด'} | รายการ: ${itemsText} | หมายเหตุ: ${o.note || 'ไม่มี'}`;
        })
        .join('\n');

      const prompt = `คุณคือ "น้องปุ๋ย AI" ผู้ช่วยอัจฉริยะประจำร้านขายปุ๋ยชาวนา (ระบบสำหรับแอดมินร้าน)
ภารกิจของคุณคือช่วยแอดมินตอบคำถามจากระบบฐานข้อมูลสดที่ส่งให้ด้านล่างนี้ โดยให้ตอบอย่างสุภาพ อารมณ์ดี น่ารัก ใส่ใจ และใช้ภาษาไทยที่อ่านง่ายเป็นกันเอง มีอีโมจิประกอบตามความเหมาะสม

ข้อมูลอ้างอิงสดจากระบบร้านปุ๋ย ณ ปัจจุบัน:
------------------------------------------
⏰ วันและเวลาปัจจุบันของระบบ: ${formattedDate}
(หมายเหตุสำคัญในการคำนวณวันนัดรับ:
- ตัวแปร pickupDate ในฐานข้อมูลเป็นข้อความฟอร์แมต YYYY-MM-DD
- ให้ใช้เวลาปัจจุบันของระบบในการพิจารณาว่าวันจันทร์นี้, วันพรุ่งนี้, หรือวันไหนๆ ตรงกับวันที่เท่าไหร่)

📦 รายการสินค้าและสต๊อกปุ๋ยทั้งหมดที่มี:
${productsContext}

📋 รายการคำสั่งซื้อ/ออเดอร์นัดรับทั้งหมดในระบบ:
${ordersContext}
------------------------------------------

คำถามจากแอดมิน: "${message}"

คำแนะนำในการตอบ:
1. ตอบข้อมูลให้ถูกต้อง ตรงประเด็นตามฐานข้อมูลจริง 100%
2. ถ้าคำถามเกี่ยวกับคิวนัดรับในวันใดวันหนึ่ง (เช่น วันจันทร์นี้) ให้ตรวจสอบดูว่าวันที่นัดรับ (pickupDate) ตรงกับวันนั้นหรือไม่ และแสดงรายชื่อลูกค้า รายการสินค้า และเวลาที่จะมารับให้ชัดเจน
3. หากสต๊อกปุ๋ยบางรายการเหลือต่ำกว่า 20 กระสอบ ให้ช่วยแนะนำแอดมินเตือนเติมสต๊อกด้วยความหวังดี
4. ตอบให้สั้น กระชับ แต่อ่านเข้าใจง่าย ไม่ต้องเกริ่นนำยาวเกินไป`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('❌ [Gemini Error] เกิดข้อผิดพลาด:', error);
      return `❌ เกิดข้อผิดพลาดในการเชื่อมต่อกับพลัง AI ของ Gemini ครับ แต่ไม่ต้องห่วง! นี่คือข้อมูลด่วนที่ตรวจพบในระบบ:\n\n${await this.generateRuleBasedResponse(message, products, orders, systemDate)}`;
    }
  }

  /**
   * 🟡 โหมดธรรมดา - ประมวลผลคำตอบแบบ Rule-Based (วิเคราะห์คำสำคัญในคำถามและดึงข้อมูลตอบกลับอย่างสวยงาม)
   */
  private generateRuleBasedResponse(
    message: string,
    products: Product[],
    orders: Order[],
    systemDate: Date,
  ): string {
    const msg = message.toLowerCase();
    let reply = '';

    // 💡 ข้อความแนะนำเรื่อง API Key เสมอ เพื่อให้คุณ Art ทราบวิธีเปิดโหมดเก่ง
    const apiTip = `\n\n💡 *[ข้อแนะนำสำหรับคุณ Art]* เพื่อให้สามารถถามตอบได้อย่างเป็นธรรมชาติและวิเคราะห์ได้ลึกซึ้งยิ่งขึ้น คุณสามารถลงทะเบียนรับคีย์ AI ฟรีที่ Google AI Studio แล้วนำมาใส่ในไฟล์ \`.env\` ที่ตัวแปร \`GEMINI_API_KEY\` ได้เลยครับ!`;

    // 1. ถามเรื่องสต๊อกปุ๋ย หรือสินค้าคงเหลือ
    if (msg.includes('เหลือ') || msg.includes('สต๊อก') || msg.includes('สตอก') || msg.includes('สินค้า') || msg.includes('ปุ๋ย')) {
      reply += `📦 *รายงานสถานะสต๊อกสินค้าปัจจุบัน* 🌿\n`;
      reply += `----------------------------------\n`;
      products.forEach((p) => {
        const warnEmoji = p.stock < 20 ? '⚠️' : '🟢';
        reply += `${warnEmoji} *${p.name}* (${p.category})\n`;
        reply += `   👉 คงเหลือ: *${p.stock}* กระสอบ | ราคา: ${Number(p.price)} บาท\n`;
      });
      reply += `----------------------------------\n`;
      reply += `📢 *แจ้งเตือน:* มีสินค้าบางรายการใกล้หมด อย่าลืมสั่งผลิตเพิ่มนะครับ!`;
      return reply + apiTip;
    }

    // 2. ถามเรื่องวันจันทร์นี้ ใครจะมารับ หรือคิวนัดรับ
    if (msg.includes('จันทร์') || msg.includes('วันจันทร์') || msg.includes('รับ')) {
      // ค้นหาวันจันทร์ถัดไปหรือวันจันทร์ที่ใกล้เคียงที่สุด
      const upcomingMondayDate = this.getUpcomingMondayDate(systemDate);

      // ดึงออเดอร์ที่เป็นวันจันทร์
      const mondayOrders = orders.filter((o) => {
        if (!o.pickupDate) return false;
        // เช็คออเดอร์ที่ pickupDate ตรงกับวันจันทร์ถัดไป หรือถ้าถามถึงวันจันทร์ทั่วไป ให้เช็คออเดอร์ที่วันเป็นวันจันทร์
        if (o.pickupDate === upcomingMondayDate) return true;

        // หรือเช็คจากตัวอักษร หรือวันในสัปดาห์
        try {
          const dateObj = new Date(o.pickupDate);
          return dateObj.getDay() === 1 && o.status !== 'ยกเลิก' && o.status !== 'จัดส่งแล้ว';
        } catch {
          return false;
        }
      });

      reply += `📋 *คิวลูกค้านัดรับปุ๋ยหน้าร้าน (วันจันทร์)* 🚜\n`;
      reply += `----------------------------------\n`;

      if (mondayOrders.length === 0) {
        reply += `✨ ไม่มีนัดรับปุ๋ยในวันจันทร์เร็วๆ นี้ครับ แอดมินสามารถพักผ่อนได้สบายใจ! 🍃\n`;
      } else {
        mondayOrders.forEach((o) => {
          const itemsText = (o.items || [])
            .map((item) => `${item.productName} x${item.quantity}`)
            .join(', ');
          reply += `👤 *คุณ ${o.customerName}* (📞 ${o.customerPhone})\n`;
          reply += `   ⏰ เวลา: *${o.pickupTime || 'ไม่ได้ระบุ'} น.* | วันที่: ${o.pickupDate}\n`;
          reply += `   📦 ปุ๋ยที่สั่ง: ${itemsText}\n`;
          reply += `   💰 ยอดที่ต้องเตรียมเก็บเงิน: *${Number(o.totalPrice).toLocaleString('th-TH')}* บาท\n`;
          if (o.note) reply += `   📝 หมายเหตุ: ${o.note}\n`;
          reply += `   ---------------------------\n`;
        });
      }
      return reply + apiTip;
    }

    // 3. ถามเรื่องลูกค้า, รายละเอียดใบสั่งซื้อ, ออเดอร์ หรือสถานะการจัดส่ง
    if (msg.includes('จัดส่ง') || msg.includes('ออเดอร์') || msg.includes('ลูกค้า') || msg.includes('ส่งแล้ว') || msg.includes('คนไหน')) {
      reply += `📋 *รายงานสถานะออเดอร์ลูกค้า* 🚜\n`;
      reply += `----------------------------------\n`;
      
      if (orders.length === 0) {
        reply += `✨ ยังไม่มีคำสั่งซื้อใดๆ ในระบบในขณะนี้ครับ\n`;
      } else {
        let filtered = orders;
        if (msg.includes('จัดส่งแล้ว') || msg.includes('ส่งแล้ว') || msg.includes('สำเร็จ')) {
          filtered = orders.filter((o) => o.status === 'จัดส่งแล้ว');
          reply += `🟢 *รายการออเดอร์ที่จัดส่งสำเร็จแล้ว:* \n\n`;
        } else if (msg.includes('รอดำเนินการ') || msg.includes('ค้าง') || msg.includes('ยังไม่ได้')) {
          filtered = orders.filter((o) => o.status === 'รอดำเนินการ');
          reply += `⏳ *รายการออเดอร์ที่ค้างจัดส่ง (รอดำเนินการ):* \n\n`;
        } else {
          reply += `📦 *รายการคำสั่งซื้อล่าสุดในระบบ:* \n\n`;
        }

        if (filtered.length === 0) {
          reply += `✨ ไม่พบรายการออเดอร์ในกลุ่มนี้เลยครับ\n`;
        } else {
          filtered.forEach((o) => {
            const itemsText = (o.items || [])
              .map((item) => `${item.productName} x${item.quantity} กระสอบ`)
              .join(', ');
            reply += `👤 *ลูกค้า:* คุณ ${o.customerName}\n`;
            reply += `   👉 เบอร์โทร: ${o.customerPhone}\n`;
            reply += `   👉 สถานะปัจจุบัน: *${o.status}*\n`;
            reply += `   👉 ปุ๋ยที่สั่ง: ${itemsText}\n`;
            reply += `   💰 ยอดเงินรวม: *${Number(o.totalPrice).toLocaleString('th-TH')}* บาท\n`;
            reply += `   ---------------------------\n`;
          });
        }
      }
      return reply + apiTip;
    }

    // 4. ถามเรื่องยอดขาย หรือภาพรวมแดชบอร์ด
    if (msg.includes('ยอดขาย') || msg.includes('เงิน') || msg.includes('ขายได้') || msg.includes('รายได้')) {
      const completed = orders.filter((o) => o.status === 'จัดส่งแล้ว');
      const totalRevenue = completed.reduce((sum, o) => sum + Number(o.totalPrice), 0);
      const pendingCount = orders.filter((o) => o.status === 'รอดำเนินการ').length;

      reply += `📊 *สรุปภาพรวมทางการเงินของร้าน* 💰\n`;
      reply += `----------------------------------\n`;
      reply += `💵 ยอดขายสะสม (จัดส่งแล้วสำเร็จ): *${totalRevenue.toLocaleString('th-TH')}* บาท\n`;
      reply += `📋 จำนวนออเดอร์ทั้งหมดในระบบ: *${orders.length}* รายการ\n`;
      reply += `⏳ ออเดอร์ที่ค้างจัดส่ง/รอดำเนินการ: *${pendingCount}* รายการ\n`;
      reply += `----------------------------------\n`;
      reply += `📈 ยอดขายรวมแข็งแกร่งมากครับร้านปุ๋ยชาวนา! ขอให้ยอดขายปังๆ ยิ่งขึ้นไปครับ`;
      return reply + apiTip;
    }

    // 4. คำทักทายทั่วไป หรือคำถามอื่นๆ
    reply += `สวัสดีครับคุณแอดมิน! ยินดีต้อนรับสู่ผู้ช่วยอัจฉริยะ *น้องปุ๋ย AI* ครับ 🌿🤖\n\n`;
    reply += `ผมสามารถช่วยดึงข้อมูลด่วนจากฐานข้อมูลมาตอบได้ทันทีครับ ตัวอย่างคำถามยอดฮิต:\n`;
    reply += `👉 *“ปุ๋ยเหลือเท่าไหร่”* (เช็คสต๊อกสินค้าทั้งหมด)\n`;
    reply += `👉 *“วันจันทร์นี้ใครจะมารับปุ๋ยบ้าง”* (ดูคิวนัดรับวันจันทร์)\n`;
    reply += `👉 *“ยอดขายรวมเป็นอย่างไรบ้าง”* (ดูสรุปยอดเงินและออเดอร์)`;

    return reply + apiTip;
  }

  /**
   * คำนวณหาวันที่ของวันจันทร์ถัดไปในฟอร์แมต YYYY-MM-DD
   */
  private getUpcomingMondayDate(now: Date): string {
    const day = now.getDay();
    // หาวันต่างเพื่อไปถึงวันจันทร์หน้า (1 = วันจันทร์)
    const diff = day === 0 ? 1 : 8 - day;
    const nextMonday = new Date(now.getTime() + diff * 24 * 60 * 60 * 1000);

    const y = nextMonday.getFullYear();
    const m = String(nextMonday.getMonth() + 1).padStart(2, '0');
    const d = String(nextMonday.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
