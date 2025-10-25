import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

@Injectable()
export class ProductsService {
  private products: Product[] = [];

  create(createProductDto: CreateProductDto): Product {
    const product: Product = {
      id: Date.now().toString(),
      ...createProductDto,
    };
    this.products.push(product);
    return product;
  }

  findAll(): Product[] {
    return this.products;
  }

  findOne(id: string): Product | undefined {
    return this.products.find(product => product.id === id);
  }

  remove(id: string): void {
    this.products = this.products.filter(product => product.id !== id);
  }

  update(id: string, updateData: Partial<Product>): Product | undefined {
    const productIndex = this.products.findIndex(product => product.id === id);
    if (productIndex === -1) return undefined;

    this.products[productIndex] = { ...this.products[productIndex], ...updateData };
    return this.products[productIndex];
  }
}