import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductApiService, Product } from '../../../product-api';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.css',
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  loading = true;
  showModal = false;
  editMode = false;
  saving = false;

  form: Partial<Product> = this.emptyForm();

  emptyForm(): Partial<Product> {
    return { name: '', price: 0, stock: 0, description: '', category: 'ปุ๋ยอินทรีย์', isFeatured: false };
  }

  categories = ['ปุ๋ยอินทรีย์', 'ปุ๋ยเคมี', 'อุปกรณ์'];

  constructor(private api: ProductApiService) { }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getProducts().subscribe({ next: (d) => { this.products = d; this.loading = false; }, error: () => { this.loading = false; } });
  }

  openAdd() { this.form = this.emptyForm(); this.editMode = false; this.showModal = true; }

  openEdit(p: Product) { this.form = { ...p }; this.editMode = true; this.showModal = true; }

  closeModal() { this.showModal = false; }

  save() {
    if (!this.form.name) return;
    this.saving = true;
    const obs = this.editMode
      ? this.api.updateProduct(this.form.id!, this.form)
      : this.api.createProduct(this.form);
    obs.subscribe({ next: () => { this.load(); this.closeModal(); this.saving = false; }, error: () => { this.saving = false; } });
  }

  delete(id: number) {
    if (!confirm('ต้องการลบสินค้านี้หรือไม่?')) return;
    this.api.deleteProduct(id).subscribe(() => this.load());
  }

  formatPrice(p: number): string { return Number(p).toLocaleString('th-TH') + ' บาท'; }
}
