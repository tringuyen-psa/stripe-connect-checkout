import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ProductsService, Product } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto): Product {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(): Product[] {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Product | undefined {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: Partial<Product>): Product | undefined {
    return this.productsService.update(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id') id: string): { message: string } {
    this.productsService.remove(id);
    return { message: 'Product deleted successfully' };
  }
}