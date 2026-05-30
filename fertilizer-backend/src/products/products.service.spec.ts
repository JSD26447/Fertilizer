import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductsService {
  private products = [
    { id: 1, name: 'ปุ๋ยคอก', stock: 50 },
    { id: 2, name: 'ปุ๋ยหมัก', stock: 20 },
    { id: 3, name: 'กระสอบเปล่า', stock: 100 },
  ];

  findAll() {
    return this.products;
  }

  create(product: { id: number; name: string; stock: number }) {
    this.products.push(product);
    return product;
  }

  updateStock(id: number, stock: number) {
    const product = this.products.find(p => p.id === id);
    if (product) {
      product.stock = stock;
    }
    return product;
  }

  delete(id: number) {
    this.products = this.products.filter(p => p.id !== id);
    return { deletedId: id };
  }
}