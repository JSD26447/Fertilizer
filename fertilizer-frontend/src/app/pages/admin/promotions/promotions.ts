import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // 👈 ช่วยให้เราใช้คำสั่ง *ngIf, *ngFor ในหน้าจอ HTML ได้
import { FormsModule } from '@angular/forms';   // 👈 ช่วยให้หน้าจอจับคู่ข้อมูลในกล่องพิมพ์เข้าตัวแปร [(ngModel)] ได้
import { ProductApiService, Promotion } from '../../../product-api'; // 👈 ดึง API และโครงสร้างข้อมูลโปรโมชั่นมาใช้

@Component({
  selector: 'app-promotions',
  standalone: true, // 🌟 บอก Angular ว่าเป็นชิ้นส่วนอิสระรันได้ด้วยตัวเอง
  imports: [CommonModule, FormsModule], // นำเข้าโมดูลอำนวยความสะดวก
  templateUrl: './promotions.html',
  styleUrl: './promotions.css',
})
export class PromotionsComponent implements OnInit {
  promotions: Promotion[] = []; // อาเรย์เก็บรายการโปรโมชั่นทั้งหมด
  loading = true;               // ตัวแปรเช็คสถานะการหมุนโหลด
  showModal = false;            // เช็คว่าต้องเปิดป๊อปอัพแบบฟอร์มไหม
  editMode = false;             // เช็คว่ากำลังแก้ไข (true) หรือกำลังเพิ่มใหม่ (false)
  saving = false;               // เช็คสถานะตอนกดเซฟ

  // 📝 กล่องโมเดลรองรับฟอร์มข้อมูล
  form: Partial<Promotion> = this.emptyForm();

  // 🧹 ฟังก์ชันล้างค่าในฟอร์มให้ว่างเปล่า
  emptyForm(): Partial<Promotion> {
    return { title: '', content: '', isActive: true };
  }

  // 🔌 เสียบสายเชื่อมดึง API คุยหลังบ้าน
  constructor(private api: ProductApiService) { }

  // 🎬 ทำงานทันทีเมื่อหน้าจอโหลดเสร็จ
  ngOnInit() {
    this.load();
  }

  // 📢 ดึงรายการโปรโมชั่นทั้งหมดจากหลังบ้านมาเก็บในอาเรย์
  load() {
    this.loading = true;
    this.api.getPromotions().subscribe({
      next: (data) => {
        this.promotions = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  // ➕ เปิดป๊อปอัพแบบฟอร์มเปล่าเพื่อ "เพิ่มโปรโมชั่นใหม่"
  openAdd() {
    this.form = this.emptyForm();
    this.editMode = false;
    this.showModal = true;
  }

  // ✏️ เปิดป๊อปอัพแบบฟอร์มพร้อมข้อมูลเก่าเพื่อ "แก้ไขโปรโมชั่น"
  openEdit(p: Promotion) {
    this.form = { ...p }; // ก๊อปปี้ข้อมูลเก่าใส่ฟอร์ม
    this.editMode = true;
    this.showModal = true;
  }

  // ❌ ปิดป๊อปอัพ
  closeModal() {
    this.showModal = false;
  }

  // 💾 กดบันทึกข้อมูล (ส่งไปหลังบ้านเพื่อเซฟลง PostgreSQL)
  save() {
    if (!this.form.title) return; // ถ้าไม่พิมพ์หัวข้อ ไม่ยอมให้กดเซฟ
    this.saving = true;

    // เช็คว่าถ้าเปิดโหมดแก้ ให้เรียก API แก้ไข / ถ้าไม่ใช่ให้เรียก API สร้างใหม่
    const obs = this.editMode
      ? this.api.updatePromotion(this.form.id!, this.form)
      : this.api.createPromotion(this.form);

    obs.subscribe({
      next: () => {
        this.load(); // ดึงข้อมูลอัปเดตใหม่มาโชว์ทันที
        this.closeModal(); // ปิดป๊อปอัพ
        this.saving = false;
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  // 🗑️ กดลบโปรโมชั่นออกจากระบบ
  delete(id: number) {
    if (!confirm('คุณต้องการลบโปรโมชั่นนี้ใช่หรือไม่?')) return;
    this.api.deletePromotion(id).subscribe(() => this.load());
  }
}
