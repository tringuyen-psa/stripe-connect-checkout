import { Controller, Post, Get, Body, Param, Query, BadRequestException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './order.entity';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order after successful payment' })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: Order
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid order data or payment not confirmed'
  })
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      // Check if order already exists for this payment intent
      const existingOrder = await this.ordersService.getOrderByPaymentIntentId(createOrderDto.paymentIntentId);
      if (existingOrder) {
        this.logger.warn(`Order already exists for payment intent: ${createOrderDto.paymentIntentId}`);
        return existingOrder;
      }

      const order = await this.ordersService.createOrder(createOrderDto);
      this.logger.log(`Order created successfully: ${order.id}`);
      return order;
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`);
      throw new BadRequestException('Failed to create order');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
    example: 'order_1234567890'
  })
  @ApiResponse({
    status: 200,
    description: 'Order found',
    type: Order
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found'
  })
  async getOrder(@Param('id') id: string): Promise<Order> {
    const order = await this.ordersService.getOrder(id);
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    return order;
  }

  @Get('payment-intent/:paymentIntentId')
  @ApiOperation({ summary: 'Get order by Payment Intent ID' })
  @ApiParam({
    name: 'paymentIntentId',
    description: 'Stripe Payment Intent ID',
    example: 'pi_1234567890abcdef'
  })
  @ApiResponse({
    status: 200,
    description: 'Order found',
    type: Order
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found'
  })
  async getOrderByPaymentIntent(@Param('paymentIntentId') paymentIntentId: string): Promise<Order> {
    const order = await this.ordersService.getOrderByPaymentIntentId(paymentIntentId);
    if (!order) {
      throw new BadRequestException('Order not found for this payment intent');
    }
    return order;
  }

  @Get('customer/:email')
  @ApiOperation({ summary: 'Get orders by customer email' })
  @ApiParam({
    name: 'email',
    description: 'Customer email address',
    example: 'customer@example.com'
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    type: [Order]
  })
  async getOrdersByEmail(@Param('email') email: string): Promise<Order[]> {
    return this.ordersService.getOrdersByEmail(email);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limit number of results',
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'All orders retrieved successfully',
    type: [Order]
  })
  async getOrders(@Query('limit') limit?: string): Promise<Order[]> {
    const orders = await this.ordersService.getOrders();

    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        return orders.slice(0, limitNum);
      }
    }

    return orders;
  }
}