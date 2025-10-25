import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { OrdersService, Order } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto): Order {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll(): Order[] {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Order | undefined {
    const order = this.ordersService.findOne(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  @Get('customer/:email')
  findByCustomerEmail(@Param('email') email: string): Order[] {
    return this.ordersService.findByEmail(email);
  }

  @Post(':id/confirm')
  confirmOrder(@Param('id') id: string): Order | undefined {
    const order = this.ordersService.updateStatus(id, 'processing');
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }
}