import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PomotionService } from './pomotion.service';
import { PomotionController } from './pomotion.controller';
import { Promotion } from './pomotion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Promotion])], // 👈 เพิ่มคีย์การ์ดสิทธิ์ตาราง Promotion เข้ามา
  providers: [PomotionService],
  controllers: [PomotionController]
})
export class PomotionModule { }
