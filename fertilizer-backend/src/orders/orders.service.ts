import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class OrdersService implements OnModuleInit {
  private notifiedPickups = new Set<number>();

  onModuleInit() {
    // ⏰ ระบบหลังบ้านจะคอยตรวจสอบคิวนัดรับทุกๆ 1 นาที (60,000 ms) เพื่อตรวจดูว่ามีใครใกล้ถึงเวลานัดรับหรือไม่
    setInterval(() => {
      this.checkUpcomingPickups().catch((err) => {
        console.error('❌ [Pickup Alert Error] เกิดข้อผิดพลาดในระบบตั้งเวลาแจ้งเตือน:', err);
      });
    }, 1 * 60 * 1000);

    console.log('🟢 [Pickup Alert System] เปิดใช้งานระบบตรวจสอบแจ้งเตือนคิวนัดรับปุ๋ยล่วงหน้า 30 นาที สำเร็จ!');
  }
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  findAll(): Promise<Order[]> {
    return this.orderRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async create(data: {
    customerName: string;
    customerPhone: string;
    note?: string;
    pickupDate?: string;
    pickupTime?: string;
    items: { productId: number; quantity: number }[];
  }): Promise<Order> {
    let totalPrice = 0;
    const orderItems: any[] = [];

    for (const item of data.items) {
      const product = await this.productRepo.findOne({ where: { id: item.productId } });
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

      const unitPrice = Number(product.price);
      totalPrice += unitPrice * item.quantity;
      product.stock = Math.max(0, product.stock - item.quantity);
      await this.productRepo.save(product);

      orderItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
      });
    }

    const order = this.orderRepo.create({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      note: data.note,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      totalPrice,
      items: orderItems,
    });

    // 🗄️ 1. บันทึกคำสั่งซื้อลง PostgreSQL
    const savedOrder = await this.orderRepo.save(order);

    // 💬 2. ยิงเตือนออเดอร์ใหม่ไปเข้า LINE ของคุณ Art แบบเบื้องหลัง (Background Task)
    this.sendLineNotification(savedOrder).catch((err) => {
      console.error('❌ [LINE Notify Error] เกิดข้อผิดพลาดหลังบ้าน:', err);
    });

    return savedOrder;
  }

  async updateStatus(id: number, status: string): Promise<Order> {
    await this.orderRepo.update(id, { status });
    return this.findOne(id);
  }

  async getDashboardStats() {
    const totalProducts = await this.productRepo.count();
    const totalOrders = await this.orderRepo.count();
    const pendingOrders = await this.orderRepo.count({ where: { status: 'รอดำเนินการ' } });
    const allOrders = await this.orderRepo.find();
    const totalRevenue = allOrders
      .filter((o) => o.status === 'จัดส่งแล้ว')
      .reduce((sum, o) => sum + Number(o.totalPrice), 0);
    const recentOrders = await this.orderRepo.find({ order: { createdAt: 'DESC' }, take: 5 });
    return { totalProducts, totalOrders, pendingOrders, totalRevenue, recentOrders };
  }

  // 🤖 3. ฟังก์ชันดึงสัญญาณส่งข้อความตรงเข้า LINE Messaging API ของ LINE OA คุณ Art
  private async sendLineNotification(order: Order) {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const userId = process.env.LINE_USER_ID;

    // ระบบข้ามการแจ้งเตือนอัตโนมัติหากกรอกรหัสไม่ครบถ้วน
    if (!token || !userId) {
      console.log('⚠️ [LINE] ยังไม่ได้กำหนดคีย์ความปลอดภัย LINE_CHANNEL_ACCESS_TOKEN หรือ LINE_USER_ID ใน .env');
      return;
    }

    // จัดฟอร์แมตรายการสินค้าสั่งซื้อให้อ่านง่าย
    const itemsText = order.items
      .map((item: any) => `  - ${item.productName} x ${item.quantity} กระสอบ (กระสอบละ ${item.unitPrice} บาท)`)
      .join('\n');

    // ฟอร์แมตข้อความแจ้งเตือนสีเขียวสดพรีเมียม
    const messageText = `🌿 มีออเดอร์สั่งซื้อปุ๋ยใหม่เข้ามาแล้ว! (#${order.id})
----------------------------------
👤 ลูกค้า: ${order.customerName}
📞 เบอร์โทร: ${order.customerPhone}
📅 วันเวลานัดรับสินค้า:
   👉 วันที่: ${order.pickupDate ? order.pickupDate : 'ไม่ได้ระบุ'}
   👉 เวลา: ${order.pickupTime ? order.pickupTime + ' น.' : 'ไม่ได้ระบุ'}
${order.note ? `📝 หมายเหตุ: ${order.note}` : ''}

📦 รายการปุ๋ยจัดส่ง:
${itemsText}

💰 ยอดรวมทั้งหมด: ${Number(order.totalPrice).toLocaleString('th-TH')} บาท (เก็บเงินปลายทาง)
----------------------------------
🔗 เปิดแผงควบคุมออเดอร์ในแอดมิน: http://localhost:4200/admin/orders`;

    try {
      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: userId,
          messages: [
            {
              type: 'text',
              text: messageText,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [LINE API] การยิงข้อความล้มเหลว:', errorData);
      } else {
        console.log('🟢 [LINE API] บอตร้านค้าทำการยิงสะกิดแจ้งเตือนคุณ Art สำเร็จแล้ว!');
      }
    } catch (error) {
      console.error('❌ [LINE API] เกิดข้อผิดพลาดเชื่อมท่อสื่อสาร API:', error);
    }
  }

  // 🔔 4. ระบบตรวจจับนัดรับล่วงหน้าของเกษตรกร และแจ้งเตือนคุณ Art ผ่าน LINE ล่วงหน้า 1 ชั่วโมง
  private async checkUpcomingPickups() {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const userId = process.env.LINE_USER_ID;
    if (!token || !userId) return;

    const now = new Date();
    
    // จัดรูปแบบ YYYY-MM-DD แบบเวลาท้องถิ่น
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    // ดึงออเดอร์นัดรับวันปัจจุบันทั้งหมด
    const activeOrders = await this.orderRepo.find({
      where: { pickupDate: todayStr }
    });

    for (const order of activeOrders) {
      // ข้ามออเดอร์ที่ถูกยกเลิก, จัดส่งสำเร็จ หรือได้แจ้งเตือนไปก่อนหน้าแล้ว
      if (
        order.status === 'จัดส่งแล้ว' || 
        order.status === 'ยกเลิก' || 
        this.notifiedPickups.has(order.id)
      ) {
        continue;
      }

      if (!order.pickupTime) continue;

      // คำนวณความต่างเวลาหน่วยนาที
      const [pStrHours, pStrMinutes] = order.pickupTime.split(':');
      const pHours = parseInt(pStrHours);
      const pMinutes = parseInt(pStrMinutes);

      const nowInMinutes = currentHours * 60 + currentMinutes;
      const pickupInMinutes = pHours * 60 + pMinutes;
      const diffMinutes = pickupInMinutes - nowInMinutes;

      // 🔔 ตั้งระบบให้เตือนก่อนเวลานัดรับจริง 30 นาที (เราใช้ช่วงความต่าง 28 - 32 นาที เพื่อให้ยิงเตือนในจังหวะรอบ 1 นาทีได้อย่างแม่นยำ)
      if (diffMinutes >= 28 && diffMinutes <= 32) {
        const itemsText = order.items
          .map((item: any) => `  - ${item.productName} x ${item.quantity} กระสอบ`)
          .join('\n');

        // 📝 ข้อความแจ้งเตือนระดับพรีเมียม สรุปคิวงานส่งตรงเข้าไลน์คุณ Art
        const alertMessage = `🔔 [แจ้งเตือนคิวนัดรับปุ๋ยล่วงหน้า 30 นาที]
คุณ Art ครับ อีก 30 นาที จะมีเกษตรกรเข้ามารับปุ๋ยหน้าร้านแล้วครับ! 🎉
----------------------------------
👤 ลูกค้า: ${order.customerName}
⏰ เวลานัดรับ: ${order.pickupTime} น. (วันนี้)
📞 เบอร์โทร: ${order.customerPhone}

📦 รายการปุ๋ยนัดรับ:
${itemsText}

💰 ยอดเงินเตรียมรับหน้าร้าน: ${Number(order.totalPrice).toLocaleString('th-TH')} บาท
----------------------------------
🔗 ตรวจดูตารางนัดทั้งหมด: http://localhost:4200/admin/orders`;

        try {
          const response = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              to: userId,
              messages: [
                {
                  type: 'text',
                  text: alertMessage,
                },
              ],
            }),
          });

          if (response.ok) {
            this.notifiedPickups.add(order.id);
            console.log(`🟢 [Pickup Alert] ส่งสัญญาณเตือนนัดรับออเดอร์ #${order.id} เข้า LINE เรียบร้อย!`);
          } else {
            console.error('❌ [Pickup Alert] การยิงข้อความเตือนล้มเหลว:', await response.json());
          }
        } catch (error) {
          console.error('❌ [Pickup Alert] มีข้อผิดพลาดในการเชื่อมต่อ LINE API:', error);
        }
      }
    }
  }
}
