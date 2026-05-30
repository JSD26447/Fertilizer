import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { Product } from './products/product.entity';
import { Admin } from './auth/admin.entity';
import { Order } from './orders/order.entity';
import { OrderItem } from './orders/order-item.entity';
import { SeedService } from './seed.service';
import { PomotionModule } from './pomotion/pomotion.module';
import { Promotion } from './pomotion/pomotion.entity';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME', 'fertilizer_db'),
        entities: [Product, Admin, Order, OrderItem, Promotion],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Product, Admin]),
    ProductsModule,
    AuthModule,
    OrdersModule,
    PomotionModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule { }