import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.create(createUserDto);
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          stripe_customer_id: user.stripe_customer_id,
          created_at: user.created_at,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get()
  async findAll() {
    try {
      const users = await this.userService.findAll();
      return {
        success: true,
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          stripe_customer_id: user.stripe_customer_id,
          created_at: user.created_at,
          subscription_count: user.subscriptions?.length || 0,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    try {
      const user = await this.userService.findByEmail(email);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          stripe_customer_id: user.stripe_customer_id,
          created_at: user.created_at,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('stripe/:customerId')
  async findByStripeCustomerId(@Param('customerId') customerId: string) {
    try {
      const user = await this.userService.findByStripeCustomerId(customerId);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          stripe_customer_id: user.stripe_customer_id,
          created_at: user.created_at,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    try {
      const user = await this.userService.findById(+id);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          stripe_customer_id: user.stripe_customer_id,
          created_at: user.created_at,
          subscriptions: user.subscriptions?.map(sub => ({
            id: sub.id,
            status: sub.status,
            current_period_end: sub.current_period_end,
            plan_name: sub.plan_name,
          })) || [],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}