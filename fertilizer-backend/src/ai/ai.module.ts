import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { Product } from '../products/product.entity';
import { Order } from '../orders/order.entity';

@Module({
  imports: [
    // เชื่อมต่อโมดูลฐานข้อมูลเพื่อให้สามารถใช้งานตัวดึงตารางสินค้าและใบสั่งซื้อได้
    TypeOrmModule.forFeature([Product, Order]),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
