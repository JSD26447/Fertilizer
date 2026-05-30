import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { PomotionService } from './pomotion.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // 👈 ตัวตรวจสิทธิ์ Admin (เหมือน @login_required ของ Django)

@Controller('promotions') // 👈 กำหนด URL หลักของฟีเจอร์นี้ คือ http://localhost:3000/promotions
export class PomotionController {

    // 🧑‍🍳 เสียบช่องสัญญาณสายด่วนเชื่อมต่อตรงไปหาแม่ครัว (Service)
    constructor(private readonly pomotionService: PomotionService) { }

    // 📢 1. เปิดรับสายด่วนประเภท GET (ดึงข้อมูลทั้งหมด)
    // Django URL: path('promotions/', views.get_promotions)
    @Get()
    getAll() {
        return this.pomotionService.findAll();
    }

    // 🔍 2. เปิดรับสายด่วนประเภท GET แบบระบุ ID (ดึงข้อมูลตัวเดียว)
    // Django URL: path('promotions/<int:id>/', views.get_one_promotion)
    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.pomotionService.findOne(Number(id));
    }

    // ➕ 3. เปิดรับสายด่วนประเภท POST สำหรับสร้างข้อมูล (จำกัดสิทธิ์เฉพาะแอดมินที่ล็อกอินแล้วเท่านั้น)
    // Django: @login_required
    @Post()
    @UseGuards(JwtAuthGuard) // 🔒 ตรวจสอบคีย์การ์ดสิทธิ์ล็อกอินแอดมิน
    create(@Body() body: any) {
        return this.pomotionService.create(body);
    }

    // ✏️ 4. เปิดรับสายด่วนประเภท PATCH สำหรับแก้ไขข้อมูล (จำกัดสิทธิ์เฉพาะแอดมิน)
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(@Param('id') id: string, @Body() body: any) {
        return this.pomotionService.update(Number(id), body);
    }

    // 🗑️ 5. เปิดรับสายด่วนประเภท DELETE สำหรับลบข้อมูล (จำกัดสิทธิ์เฉพาะแอดมิน)
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    delete(@Param('id') id: string) {
        return this.pomotionService.delete(Number(id));
    }
}
