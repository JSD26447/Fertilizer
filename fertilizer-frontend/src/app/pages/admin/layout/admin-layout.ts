import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  username = '';
  sidebarOpen = false;

  constructor(private auth: AuthService, private router: Router) {
    this.username = this.auth.getUsername();
  }

  ngOnInit() {
    // เปลี่ยน Viewport เป็นโหมด Desktop เพื่อให้ระบบย่อขนาดพอดีจอมือถือ และผู้ใช้สามารถซูมดูได้
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=1200');
    }
  }

  ngOnDestroy() {
    this.restoreViewport();
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar() { this.sidebarOpen = false; }
  
  logout() { 
    this.auth.logout(); 
    this.sidebarOpen = false; 
    this.restoreViewport();
  }
  
  goHome() { 
    this.router.navigate(['/']); 
    this.sidebarOpen = false; 
    this.restoreViewport();
  }

  private restoreViewport() {
    // คืนค่า Viewport ให้หน้าร้านกลับมาเป็นแบบ Responsive รองรับมือถือปกติ
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1');
    }
  }
}
