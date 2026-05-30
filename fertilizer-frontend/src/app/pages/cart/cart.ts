import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';
import { ProductApiService } from '../../product-api';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent implements OnInit {
  items: CartItem[] = [];
  customerName = '';
  customerPhone = '';
  note = '';
  pickupDate = '';
  pickupTime = '';
  loading = false;
  success = false;
  orderId: number | null = null;

  constructor(private cart: CartService, private api: ProductApiService, private router: Router) {}

  ngOnInit() {
    this.cart.cart$.subscribe(items => this.items = items);
  }

  updateQty(productId: number, qty: number) {
    if (qty <= 0) { this.cart.removeItem(productId); return; }
    this.cart.updateQty(productId, qty);
  }

  remove(productId: number) { this.cart.removeItem(productId); }

  getTotal(): number { return this.cart.getTotal(); }

  formatPrice(p: number): string { return Number(p).toLocaleString('th-TH') + ' บาท'; }

  canCheckout(): boolean {
    return this.items.length > 0 && 
           !!this.customerName.trim() && 
           !!this.customerPhone.trim() && 
           !!this.pickupDate && 
           !!this.pickupTime;
  }

  checkout() {
    if (!this.canCheckout()) return;
    this.loading = true;
    const orderData = {
      customerName: this.customerName.trim(),
      customerPhone: this.customerPhone.trim(),
      note: this.note.trim(),
      pickupDate: this.pickupDate,
      pickupTime: this.pickupTime,
      items: this.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
    };
    this.api.createOrder(orderData).subscribe({
      next: (order) => {
        this.orderId = order.id;
        this.success = true;
        this.cart.clear();
        this.loading = false;
      },
      error: () => { this.loading = false; alert('เกิดข้อผิดพลาด กรุณาลองใหม่'); }
    });
  }

  goHome() { this.router.navigate(['/']); }
}
