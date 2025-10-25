import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';

export interface Order {
  id: string;
  items: any[];
  customer: any;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class OrdersService {
  private orders: Order[] = [];

  create(createOrderDto: CreateOrderDto): Order {
    const order: Order = {
      id: Date.now().toString(),
      ...createOrderDto,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.push(order);
    return order;
  }

  findAll(): Order[] {
    return this.orders;
  }

  findOne(id: string): Order | undefined {
    return this.orders.find(order => order.id === id);
  }

  updateStatus(id: string, status: Order['status']): Order | undefined {
    const orderIndex = this.orders.findIndex(order => order.id === id);
    if (orderIndex === -1) return undefined;

    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      status,
      updatedAt: new Date(),
    };
    return this.orders[orderIndex];
  }

  findByEmail(email: string): Order[] {
    return this.orders.filter(order => order.customer.email === email);
  }
}