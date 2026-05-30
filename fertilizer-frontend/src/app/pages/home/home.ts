import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductApiService, Product, Promotion } from '../../product-api';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  products: Product[] = [];
  filtered: Product[] = [];
  categories: string[] = [];
  selectedCategory = 'ทั้งหมด';
  search = '';
  cartCount = 0;
  addedId: number | null = null;
  loading = true;
  activePromotions: Promotion[] = []; // 📢 ตัวแปรเก็บข่าวโปรโมชั่นที่เปิดใช้งาน

  constructor(private api: ProductApiService, private cart: CartService, private router: Router) {}

  ngOnInit() {
    this.api.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.filtered = data;
        this.categories = ['ทั้งหมด', ...new Set(data.map(p => p.category))];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    // 📢 ดึงข่าวโปรโมชั่นล่าสุดจากหลังบ้าน เฉพาะอันที่สั่งเปิดใช้งาน
    this.api.getPromotions().subscribe({
      next: (promos) => {
        this.activePromotions = promos.filter(p => p.isActive);
      }
    });

    this.cart.cart$.subscribe(() => { this.cartCount = this.cart.getCount(); });
  }

  filterProducts() {
    this.filtered = this.products.filter(p => {
      const matchCat = this.selectedCategory === 'ทั้งหมด' || p.category === this.selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(this.search.toLowerCase());
      return matchCat && matchSearch;
    });
  }

  setCategory(cat: string) {
    this.selectedCategory = cat;
    this.filterProducts();
  }

  addToCart(product: Product) {
    if (product.stock <= 0) return;
    this.cart.addItem({
      productId: product.id,
      productName: product.name,
      price: Number(product.price),
      quantity: 1,
    });
    this.addedId = product.id;
    setTimeout(() => this.addedId = null, 1500);
  }

  goToCart() { this.router.navigate(['/cart']); }
  goToAdmin() { this.router.navigate(['/admin']); }

  formatPrice(p: number): string {
    return Number(p).toLocaleString('th-TH') + ' บาท';
  }

  getCategoryClass(cat: string): string {
    const map: any = { 'ปุ๋ยอินทรีย์': 'badge-green', 'ปุ๋ยเคมี': 'badge-blue', 'อุปกรณ์': 'badge-yellow' };
    return map[cat] || 'badge-gray';
  }

  getProductImage(product: Product): string {
    if (product.imageUrl) {
      return product.imageUrl;
    }
    const name = product.name.toLowerCase();
    
    if (name.includes('ปุ๋ยคอก') || name.includes('หมู')) {
      return '/images/2-removebg-preview.png';
    }
    if (name.includes('หมัก') || name.includes('กระสอบ') || name.includes('bio')) {
      return '/images/3-removebg-preview.png';
    }
    if (name.includes('npk') || name.includes('15-15-15')) {
      return '/images/4-removebg-preview.png';
    }
    if (name.includes('ยูเรีย') || name.includes('46-0-0') || name.includes('nk') || name.includes('13-0-46')) {
      return '/images/5-removebg-preview.png';
    }
    
    // Fallbacks based on category
    if (product.category === 'ปุ๋ยอินทรีย์') {
      return '/images/2-removebg-preview.png';
    }
    if (product.category === 'ปุ๋ยเคมี') {
      return '/images/5-removebg-preview.png';
    }
    return '/images/3-removebg-preview.png';
  }
}
