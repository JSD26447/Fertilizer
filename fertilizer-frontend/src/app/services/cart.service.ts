import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private items$ = new BehaviorSubject<CartItem[]>(this.load());

  cart$ = this.items$.asObservable();

  private load(): CartItem[] {
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
  }

  private save(items: CartItem[]) {
    localStorage.setItem('cart', JSON.stringify(items));
    this.items$.next(items);
  }

  getItems(): CartItem[] { return this.items$.getValue(); }

  addItem(item: CartItem) {
    const items = this.getItems();
    const existing = items.find(i => i.productId === item.productId);
    if (existing) { existing.quantity += item.quantity; }
    else { items.push({ ...item }); }
    this.save(items);
  }

  updateQty(productId: number, quantity: number) {
    const items = this.getItems().map(i => i.productId === productId ? { ...i, quantity } : i);
    this.save(items);
  }

  removeItem(productId: number) {
    this.save(this.getItems().filter(i => i.productId !== productId));
  }

  clear() { this.save([]); }

  getTotal(): number {
    return this.getItems().reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  getCount(): number {
    return this.getItems().reduce((sum, i) => sum + i.quantity, 0);
  }
}
