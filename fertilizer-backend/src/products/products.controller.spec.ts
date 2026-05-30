import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get()
  getAll() {
    return this.productsService.findAll();
  }

  @Post()
  create(@Body() body: { id: number; name: string; stock: number }) {
    return this.productsService.create(body);
  }

  @Patch(':id')
  updateStock(@Param('id') id: string, @Body() body: { stock: number }) {
    return this.productsService.updateStock(Number(id), body.stock);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.productsService.delete(Number(id));
  }
}