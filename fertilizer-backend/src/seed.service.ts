import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './products/product.entity';
import { Admin } from './auth/admin.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Admin) private adminRepo: Repository<Admin>,
  ) {}

  async onApplicationBootstrap() {
    const adminCount = await this.adminRepo.count();
    if (adminCount === 0) {
      const passwordHash = await bcrypt.hash('admin007', 10);
      await this.adminRepo.save({ username: 'admin', passwordHash });
      console.log('✅ Admin seeded: admin / admin007');
    }

    const productCount = await this.productRepo.count();
    if (productCount === 0) {
      await this.productRepo.save([
        { name: 'ปุ๋ยคอก', price: 150, stock: 50, description: 'ปุ๋ยคอกคุณภาพสูง ช่วยบำรุงดิน', category: 'ปุ๋ยอินทรีย์' },
        { name: 'ปุ๋ยหมัก', price: 120, stock: 30, description: 'ปุ๋ยหมักธรรมชาติจากวัสดุเหลือทิ้ง', category: 'ปุ๋ยอินทรีย์' },
        { name: 'ปุ๋ย NPK 15-15-15', price: 350, stock: 100, description: 'ปุ๋ยเคมีสูตรสมดุล เหมาะทุกพืช', category: 'ปุ๋ยเคมี' },
        { name: 'ปุ๋ยยูเรีย 46-0-0', price: 450, stock: 80, description: 'ปุ๋ยไนโตรเจนสูง เร่งการเจริญเติบโต', category: 'ปุ๋ยเคมี' },
        { name: 'ปุ๋ย NK 13-0-46', price: 420, stock: 60, description: 'ปุ๋ยโพแทสเซียมสูง เหมาะสำหรับผลไม้', category: 'ปุ๋ยเคมี' },
        { name: 'กระสอบเปล่า', price: 15, stock: 500, description: 'กระสอบคุณภาพดีสำหรับบรรจุปุ๋ย', category: 'อุปกรณ์' },
      ]);
      console.log('✅ Products seeded');
    }
  }
}
