import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './order.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private orders: Order[] = []; // In-memory storage - replace with database in production

  constructor(private configService: ConfigService) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      const order: Order = {
        id: `order_${uuidv4()}`,
        paymentIntentId: createOrderDto.paymentIntentId,
        customer: createOrderDto.customer,
        items: createOrderDto.items,
        subtotal: createOrderDto.subtotal,
        tax: createOrderDto.tax,
        shipping: createOrderDto.shipping,
        total: createOrderDto.total,
        paymentMethodId: createOrderDto.paymentMethodId,
        currency: createOrderDto.currency,
        status: 'completed', // Payment was successful, so order is completed
        isExpressCheckout: createOrderDto.isExpressCheckout || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store the order (in production, save to database)
      this.orders.push(order);

      this.logger.log(`Order created successfully: ${order.id} for payment intent: ${order.paymentIntentId}`);

      return order;
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`);
      throw error;
    }
  }

  async getOrder(id: string): Promise<Order | null> {
    const order = this.orders.find(o => o.id === id);
    if (!order) {
      this.logger.warn(`Order not found: ${id}`);
      return null;
    }
    return order;
  }

  async getOrderByPaymentIntentId(paymentIntentId: string): Promise<Order | null> {
    const order = this.orders.find(o => o.paymentIntentId === paymentIntentId);
    if (!order) {
      this.logger.warn(`Order not found for payment intent: ${paymentIntentId}`);
      return null;
    }
    return order;
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    const orders = this.orders.filter(o => o.customer.email === email);
    this.logger.log(`Found ${orders.length} orders for email: ${email}`);
    return orders;
  }

  async getOrders(): Promise<Order[]> {
    return this.orders;
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<Order | null> {
    const orderIndex = this.orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      this.logger.warn(`Order not found for status update: ${id}`);
      return null;
    }

    this.orders[orderIndex].status = status;
    this.orders[orderIndex].updatedAt = new Date();

    this.logger.log(`Order status updated: ${id} -> ${status}`);
    return this.orders[orderIndex];
  }
}