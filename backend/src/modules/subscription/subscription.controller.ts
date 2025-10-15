import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto, CancelSubscriptionDto } from './dto/create-subscription.dto';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: CreateSubscriptionDto })
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    try {
      const result = await this.subscriptionService.createSubscription(createSubscriptionDto);
      return result;
    } catch (error) {
      console.error('❌ Error creating subscription:', error);
      return {
        success: false,
        error: error.message || 'Failed to create subscription',
      };
    }
  }

  @Get('user/:email')
  async getUserSubscriptions(@Param('email') email: string) {
    try {
      const result = await this.subscriptionService.getUserSubscriptions(email);
      return result;
    } catch (error) {
      console.error('❌ Error fetching subscriptions:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch subscriptions',
      };
    }
  }

  @Get('plans')
  async getPlans() {
    try {
      const result = await this.subscriptionService.getActivePlans();
      return result;
    } catch (error) {
      console.error('❌ Error fetching plans:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch plans',
      };
    }
  }

  @Post(':id/cancel')
  async cancelSubscription(
    @Param('id') id: string,
    @Body() cancelDto: CancelSubscriptionDto,
  ) {
    try {
      const { cancelAtPeriodEnd = true, useConnectedAccount = false } = cancelDto;
      const result = await this.subscriptionService.cancelSubscription(
        +id,
        cancelAtPeriodEnd,
        useConnectedAccount,
      );
      return result;
    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel subscription',
      };
    }
  }

  @Post(':id/renew')
  async renewSubscription(
    @Param('id') id: string,
    @Body() body: { useConnectedAccount?: boolean },
  ) {
    try {
      const { useConnectedAccount = false } = body;
      const result = await this.subscriptionService.renewSubscription(
        +id,
        useConnectedAccount,
      );
      return result;
    } catch (error) {
      console.error('❌ Error renewing subscription:', error);
      return {
        success: false,
        error: error.message || 'Failed to renew subscription',
      };
    }
  }
}