import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ProductApiService } from '../../../product-api';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  username = '';
  sidebarOpen = false;

  // 🤖 ตัวแปรควบคุมระบบแชทผู้ช่วย AI (RAG Widget)
  chatOpen = false;
  hasUnread = true; // จุดสีส้มสะดุดตาแจ้งเตือนเมื่อยังไม่เคยกดเปิด
  chatInputText = '';
  aiLoading = false;

  chatMessages: { text: string; isUser: boolean; time: string }[] = [
    {
      text: 'สวัสดีครับคุณแอดมิน! ผมคือ <b>น้องปุ๋ย AI 🤖🌿</b> ผู้ช่วยอัจฉริยะประจำร้านขายปุ๋ยชาวนาครับ<br/><br/>ผมได้รับการเชื่อมท่อข้อมูลสดกับฐานข้อมูลหลัก สามารถตอบคำถามได้แบบเรียลไทม์ 100% เลยครับ ลองถามผมได้เลยเช่น:<br/>• 📦 <i>ปุ๋ยคอกคงเหลือเท่าไหร่?</i><br/>• 📅 <i>วันจันทร์นี้ใครจะมารับปุ๋ยบ้าง?</i><br/>• 💵 <i>ยอดขายสะสมเป็นอย่างไร?</i>',
      isUser: false,
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    }
  ];

  chatSuggestions = [
    'ปุ๋ยคอกเหลือเท่าไหร่?',
    'วันจันทร์นี้ใครมารับปุ๋ยบ้าง?',
    'สรุปยอดขายปัจจุบัน'
  ];

  @ViewChild('chatBody') private chatBody!: ElementRef;

  constructor(
    private auth: AuthService,
    private router: Router,
    private api: ProductApiService
  ) {
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

  // 🤖 ระบบควบคุมส่วนแสดงผลของหน้าต่างแชท AI
  toggleChat() {
    this.chatOpen = !this.chatOpen;
    if (this.chatOpen) {
      this.hasUnread = false;
      this.scrollToBottom();
    }
  }

  sendSuggestion(suggestion: string) {
    this.chatInputText = suggestion;
    this.sendChatMessage();
  }

  sendChatMessage() {
    const text = this.chatInputText.trim();
    if (!text || this.aiLoading) return;

    this.chatInputText = '';
    const nowStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    // 1. นำคำถามของผู้ใช้ขึ้นกล่องหน้าต่างแชททันที
    this.chatMessages.push({ text, isUser: true, time: nowStr });
    this.aiLoading = true;
    this.scrollToBottom();

    // 2. ยิงไปขอคำตอบที่ฉลาดล้ำจากระบบ AI หลังบ้าน
    this.api.askAi(text).subscribe({
      next: (response) => {
        this.aiLoading = false;
        const formattedReply = this.formatAiReply(response.reply);
        this.chatMessages.push({
          text: formattedReply,
          isUser: false,
          time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
        });
        this.scrollToBottom();
      },
      error: () => {
        this.aiLoading = false;
        this.chatMessages.push({
          text: '❌ <i>ไม่สามารถเชื่อมต่อสัญญาณ AI ได้สำเร็จ กรุณาเช็คอินเทอร์เน็ตหรือติดต่อผู้พัฒนาครับ</i>',
          isUser: false,
          time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
        });
        this.scrollToBottom();
      }
    });
  }

  /**
   * ฟังก์ชันขยับ Scroll Bar ลงล่างสุดเพื่อให้มองเห็นข้อความล่าสุดได้อย่างพรีเมียม
   */
  private scrollToBottom() {
    setTimeout(() => {
      try {
        if (this.chatBody) {
          this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
        }
      } catch (err) { }
    }, 80);
  }

  /**
   * ตัวช่วยจัดระเบียบฟอร์แมต Markdown จาก AI ให้เป็น HTML สุดสวยงามบนหน้าจอแชท
   */
  private formatAiReply(text: string): string {
    if (!text) return '';
    // เปลี่ยนสัญลักษณ์เว้นบรรทัด
    let formatted = text.replace(/\n/g, '<br/>');
    // เปลี่ยนเครื่องหมายตัวหนาแบบ Markdown (**text**) ให้เป็นตัวหนา HTML (<b>text</b>)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<b>$1</b>');
    return formatted;
  }
}
