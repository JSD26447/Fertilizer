import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

// 1. บอกระบบว่าคลาสนี้คือ ตารางในฐานข้อมูลที่ชื่อ 'promotions'
@Entity('promotions')
export class Promotion {

    // 2. เลขไอดีสินค้าแบบรันอัตโนมัติ (Primary Key)
    @PrimaryGeneratedColumn()
    id: number;

    // 3. หัวข้อโปรโมชั่น (เป็นตัวหนังสือ)
    @Column()
    title: string;

    // 4. รายละเอียดโปรโมชั่น (เป็นข้อความยาวแบบ Text, อนุญาตให้เป็นค่าว่างได้)
    @Column({ type: 'text', nullable: true })
    content: string;

    // 5. สถานะเปิด-ปิดโปรโมชั่น (ค่าเริ่มต้นเป็น จริง/เปิดใช้งาน)
    @Column({ default: true, name: 'is_active' })
    isActive: boolean;

    // 6. บันทึกวันเวลาที่สร้างข่าวโปรโมชั่นนี้อัตโนมัติ
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
