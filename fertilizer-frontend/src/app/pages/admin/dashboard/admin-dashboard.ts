import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductApiService } from '../../../product-api';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboardComponent implements OnInit {
  stats: any = null;
  loading = true;

  constructor(private api: ProductApiService) {}

  ngOnInit() {
    this.api.getDashboard().subscribe({
      next: (data) => { this.stats = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  formatPrice(p: number): string { return Number(p).toLocaleString('th-TH') + ' บาท'; }

  getStatusClass(status: string): string {
    const map: any = { 'รอดำเนินการ': 'badge-yellow', 'กำลังจัดส่ง': 'badge-blue', 'จัดส่งแล้ว': 'badge-green', 'ยกเลิก': 'badge-red' };
    return map[status] || 'badge-gray';
  }
}
