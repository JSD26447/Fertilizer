import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description: string;
  imageUrl: string;
  category: string;
  isFeatured?: boolean;
}

export interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  totalPrice: number;
  status: string;
  note: string;
  pickupDate?: string;
  pickupTime?: string;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}
export interface Promotion {
  id?: number;
  title: string;
  content: string;
  isActive: boolean;
  createdAt?: string;
}


@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  createProduct(data: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, data);
  }

  updateProduct(id: number, data: Partial<Product>): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/products/${id}`, data);
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`);
  }

  createOrder(data: any): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders`, data);
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`);
  }

  updateOrderStatus(id: number, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/orders/${id}/status`, { status });
  }

  getDashboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/dashboard`);
  }
  // 📢 เมธอดสำหรับดึงข้อมูลโปรโมชั่น
  // 📢 1. สั่งจูนช่องดึงข้อมูลโปรโมชั่นทั้งหมดจากหลังบ้าน
  getPromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${this.apiUrl}/promotions`);
  }

  // ➕ 2. สั่งยิงข้อมูลเพื่อเซฟสร้างโปรโมชั่นใหม่
  createPromotion(data: Partial<Promotion>): Observable<Promotion> {
    return this.http.post<Promotion>(`${this.apiUrl}/promotions`, data);
  }

  // ✏️ 3. สั่งยิงข้อมูลเพื่อแก้ไขโปรโมชั่นที่มีอยู่แล้ว
  updatePromotion(id: number, data: Partial<Promotion>): Observable<Promotion> {
    return this.http.patch<Promotion>(`${this.apiUrl}/promotions/${id}`, data);
  }

  // 🗑️ 4. สั่งสั่งลบโปรโมชั่นโดยระบุ ID
  deletePromotion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/promotions/${id}`);
  }

  // 🤖 5. บริการส่งคำถามไปยังผู้ช่วย AI (RAG)
  askAi(message: string): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(`${this.apiUrl}/ai/chat`, { message });
  }

}