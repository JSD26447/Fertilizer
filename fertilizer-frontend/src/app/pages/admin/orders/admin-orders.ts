import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductApiService, Order } from '../../../product-api';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css',
})
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  filtered: Order[] = [];
  loading = true;
  filterStatus = 'ทั้งหมด';
  selectedOrder: Order | null = null;

  statuses = ['ทั้งหมด', 'รอดำเนินการ', 'กำลังจัดส่ง', 'จัดส่งแล้ว', 'ยกเลิก'];

  // 📅 ข้อมูลสำหรับจัดการปฏิทินและตารางงาน
  viewMode: 'table' | 'calendar' = 'calendar'; // 🌟 เปลี่ยนค่าเริ่มต้นให้เปิดมาเจอ ปฏิทิน สุดพรีเมียมก่อนเลยครับ!
  calendarDays: { dateString: string; dayNum: number; isCurrentMonth: boolean; orders: Order[] }[] = [];
  currentMonthDate = new Date();
  weekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  // 📌 กระดานงานเด่น: "วันนี้นัดรับกับใครบ้าง" (Today's Scheduled Pickups Agenda)
  todayOrders: Order[] = [];

  constructor(private api: ProductApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getOrders().subscribe({
      next: (data) => { 
        this.orders = data; 
        this.applyFilter(); 
        this.generateCalendar(); // คำนวณวันปฏิทิน
        this.filterTodayOrders(); // ดึงรายชื่อคนที่มีนัดรับปุ๋ยเฉพาะวันนี้
        this.loading = false; 
      },
      error: () => { this.loading = false; }
    });
  }

  // 🔍 คัดกรองออเดอร์แบ่งตามสถานะการส่งมอบปุ๋ย
  applyFilter() {
    this.filtered = this.filterStatus === 'ทั้งหมด'
      ? this.orders
      : this.orders.filter(o => o.status === this.filterStatus);
  }

  setFilter(s: string) { this.filterStatus = s; this.applyFilter(); }

  // ✏️ คำสั่งอัปเดตสถานะปุ๋ย และคำนวณปฏิทิน/กระดานงานใหม่เรียลไทม์
  updateStatus(order: Order, status: string) {
    this.api.updateOrderStatus(order.id, status).subscribe(() => {
      order.status = status;
      this.applyFilter();
      this.generateCalendar();
      this.filterTodayOrders();
    });
  }

  viewDetail(order: Order) { this.selectedOrder = order; }
  closeDetail() { this.selectedOrder = null; }

  formatPrice(p: number): string { return Number(p).toLocaleString('th-TH') + ' บาท'; }

  // 🎨 ดึงคลาสสีตราสัญลักษณ์สถานะ (Badge)
  getStatusClass(status: string): string {
    const map: any = { 'รอดำเนินการ': 'badge-yellow', 'กำลังจัดส่ง': 'badge-blue', 'จัดส่งแล้ว': 'badge-green', 'ยกเลิก': 'badge-red' };
    return map[status] || 'badge-gray';
  }

  // 📅 หาข้อความ วันที่วันนี้ ในรูปแบบ YYYY-MM-DD แบบตรง timezone
  getTodayDateString(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // 📌 คัดกรองและเรียงคิวผู้สั่งซื้อที่นัดเข้ามารับปุ๋ยเฉพาะ "วันนี้" เท่านั้น
  filterTodayOrders() {
    const todayStr = this.getTodayDateString();
    this.todayOrders = this.orders
      .filter(o => o.pickupDate === todayStr && o.status !== 'ยกเลิก')
      .sort((a, b) => {
        // เรียงคิวจากเช้าไปหาเย็นตามเวลานัดหมาย
        const timeA = a.pickupTime || '00:00';
        const timeB = b.pickupTime || '00:00';
        return timeA.localeCompare(timeB);
      });
  }

  // 📅 ฟังก์ชันคำนวณและวาดตารางปฏิทินแบบ Custom
  generateCalendar() {
    const year = this.currentMonthDate.getFullYear();
    const month = this.currentMonthDate.getMonth();

    // วันแรกของเดือน (หาวันในสัปดาห์ 0-6)
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();

    // จำนวนวันทั้งหมดในเดือนปัจจุบัน
    const totalDays = new Date(year, month + 1, 0).getDate();

    // จำนวนวันทั้งหมดในเดือนก่อนหน้า
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // เติมช่องปะว่างของเดือนก่อนหน้า (Padding)
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateString = this.formatDateString(prevDate);
      days.push({
        dateString,
        dayNum,
        isCurrentMonth: false,
        orders: this.getPickupsForDate(dateString)
      });
    }

    // เติมวันในเดือนปัจจุบัน
    for (let i = 1; i <= totalDays; i++) {
      const currDate = new Date(year, month, i);
      const dateString = this.formatDateString(currDate);
      days.push({
        dateString,
        dayNum: i,
        isCurrentMonth: true,
        orders: this.getPickupsForDate(dateString)
      });
    }

    // เติมช่องปะว่างของเดือนถัดไปให้ครบ 42 ช่อง (6 แถว)
    const totalCells = 42;
    const nextDaysNeeded = totalCells - days.length;
    for (let i = 1; i <= nextDaysNeeded; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateString = this.formatDateString(nextDate);
      days.push({
        dateString,
        dayNum: i,
        isCurrentMonth: false,
        orders: this.getPickupsForDate(dateString)
      });
    }

    this.calendarDays = days;
  }

  formatDateString(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  getPickupsForDate(dateStr: string): Order[] {
    return this.orders.filter(o => o.pickupDate === dateStr && o.status !== 'ยกเลิก');
  }

  prevMonth() {
    this.currentMonthDate = new Date(this.currentMonthDate.getFullYear(), this.currentMonthDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentMonthDate = new Date(this.currentMonthDate.getFullYear(), this.currentMonthDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  getMonthName(): string {
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return months[this.currentMonthDate.getMonth()] + ' ' + (this.currentMonthDate.getFullYear() + 543);
  }
}
