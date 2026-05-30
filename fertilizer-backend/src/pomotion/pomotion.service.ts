import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; // 👈 ตัวช่วยดึงคีย์การ์ดฐานข้อมูล
import { Repository } from 'typeorm'; // 👈 ตัวควบคุมการคิวรี่สากล (Repository)
import { Promotion } from './pomotion.entity'; // 👈 โครงสร้างตารางโปรโมชั่น

@Injectable()
export class PomotionService {

    // 🔑 คอนสตรัคเตอร์ เปรียบเสมือนการจ้างแม่ครัวพร้อมยื่นกุญแจตู้เย็นตาราง Promotion ให้ถือไว้ใช้
    // private promotionRepository จะมีฤทธิ์เดชเหมือนคำสั่ง `Promotion.objects` ของ Django เลยครับ!
    constructor(
        @InjectRepository(Promotion)
        private promotionRepository: Repository<Promotion>,
    ) { }

    // 📢 1. ดึงโปรโมชั่นทั้งหมดเรียงตาม ID น้อยไปมาก
    // Django: Promotion.objects.all().order_by('id')
    findAll(): Promise<Promotion[]> {
        return this.promotionRepository.find({ order: { id: 'ASC' } });
    }

    // 🔍 2. ดึงข้อมูลโปรโมชั่นแค่ตัวเดียวด้วย ID
    // Django: Promotion.objects.get(id=id)
    async findOne(id: number): Promise<Promotion> {
        const promotion = await this.promotionRepository.findOne({ where: { id } });
        if (!promotion) throw new NotFoundException(`ไม่พบโปรโมชั่นไอดี ${id}`);
        return promotion;
    }

    // ➕ 3. สร้างโปรโมชั่นใหม่ลงฐานข้อมูล
    // Django: Promotion.objects.create(**data)
    create(data: Partial<Promotion>): Promise<Promotion> {
        const promotion = this.promotionRepository.create(data); // เตรียมข้อมูลร่าง
        return this.promotionRepository.save(promotion); // เซฟลงฐานข้อมูลจริง
    }

    // ✏️ 4. อัปเดตข้อมูลโปรโมชั่นตัวที่มีอยู่แล้ว
    // Django: Promotion.objects.filter(id=id).update(**data)
    async update(id: number, data: Partial<Promotion>): Promise<Promotion> {
        await this.promotionRepository.update(id, data);
        return this.findOne(id); // ดึงข้อมูลตัวที่เพิ่งอัปเดตกลับไปส่งให้ผู้ใช้ดู
    }

    // 🗑️ 5. ลบโปรโมชั่นออกจากระบบ
    // Django: Promotion.objects.filter(id=id).delete()
    async delete(id: number): Promise<{ deletedId: number }> {
        await this.promotionRepository.delete(id);
        return { deletedId: id };
    }
}