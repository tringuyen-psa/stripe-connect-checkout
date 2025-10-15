import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { SubscriptionPlan } from '../subscription-plan/entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { StripeConfigService } from '../../config/stripe.config';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription)
    private subscriptionRepository: Repository<UserSubscription>,
    private stripeConfigService: StripeConfigService,
  ) {}

  async createSubscription(createSubscriptionDto: CreateSubscriptionDto) {
    const {
      email,
      name,
      planId,
      paymentMethodId,
      useConnectedAccount = false,
    } = createSubscriptionDto;

    console.log('🎯 CREATING SUBSCRIPTION');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);
    console.log('📦 Plan ID:', planId);
    console.log('💳 Payment Method ID:', paymentMethodId);
    console.log('🏪 Use Connected Account:', useConnectedAccount);

    // Find plan
    const plan = await this.planRepository.findOne({
      where: { id: planId, is_active: true },
    });

    if (!plan) {
      throw new Error('Plan not found or inactive');
    }

    console.log('📋 Plan found:', plan.name, '-', plan.price);

    // Find or create user
    let user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Create Stripe customer
      const stripe = this.stripeConfigService.getStripe(useConnectedAccount);
      const customerData = {
        email,
        name,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      };

      const stripeCustomer = await stripe.customers.create(customerData);

      // Create user
      user = this.userRepository.create({
        email,
        name,
        stripe_customer_id: stripeCustomer.id,
      });

      user = await this.userRepository.save(user);
      console.log('👤 Created new user:', user.id);
    } else {
      console.log('👤 Found existing user:', user.id);
    }

    // Create subscription in Stripe
    const stripe = this.stripeConfigService.getStripe(useConnectedAccount);
    const subscriptionData = {
      customer: user.stripe_customer_id,
      items: [{ price: plan.stripe_price_id }],
      payment_behavior: 'default_incomplete' as any,
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'] as any,
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        plan_id: plan.id.toString(),
        user_id: user.id.toString(),
      },
    };

    const subscription = await stripe.subscriptions.create(subscriptionData as any);
    console.log('✅ Subscription created:', subscription.id);

    // Get client secret
    const latestInvoice = subscription.latest_invoice as any;
    let clientSecret = null;

    if (latestInvoice?.payment_intent?.client_secret) {
      clientSecret = latestInvoice.payment_intent.client_secret;
    }

    // Save to database
    const subscriptionRecord = this.subscriptionRepository.create({
      user_id: user.id,
      plan_id: plan.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: user.stripe_customer_id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      amount: plan.price,
      currency: plan.currency,
      interval: plan.interval,
      metadata: {
        use_connected_account: useConnectedAccount.toString(),
        plan_name: plan.name,
      },
    });

    await this.subscriptionRepository.save(subscriptionRecord);
    console.log('💾 Saved subscription to database:', subscriptionRecord.id);

    return {
      success: true,
      subscriptionId: subscription.id,
      clientSecret,
      subscription: {
        id: subscriptionRecord.id,
        status: subscription.status,
        current_period_end: subscriptionRecord.current_period_end,
        plan: {
          name: plan.name,
          price: plan.price,
          currency: plan.currency,
          interval: plan.interval,
        },
      },
      connectedAccountId: useConnectedAccount ? this.stripeConfigService.getConnectAccountId() : null,
      chargeType: this.stripeConfigService.getChargeType(useConnectedAccount),
    };
  }

  async getUserSubscriptions(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['subscriptions'],
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const subscriptions = await this.subscriptionRepository.find({
      where: { user_id: user.id },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });

    return {
      success: true,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        status: sub.status,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        plan: {
          name: sub.plan?.name || 'Unknown',
          description: sub.plan?.description,
          features: sub.plan?.features,
        },
        amount: sub.amount,
        currency: sub.currency,
        interval: sub.interval,
        created_at: sub.created_at,
      })),
    };
  }

  async cancelSubscription(id: number, cancelAtPeriodEnd = true, useConnectedAccount = false) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Cancel in Stripe
    const stripe = this.stripeConfigService.getStripe(useConnectedAccount);
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });

    // Update in database
    await this.subscriptionRepository.update(id, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });

    console.log('🚫 Subscription cancellation processed:', id);

    return {
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: cancelAtPeriodEnd,
        current_period_end: subscription.current_period_end,
        plan: {
          name: subscription.plan?.name || 'Unknown',
        },
      },
    };
  }

  async renewSubscription(id: number, useConnectedAccount = false) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Remove cancellation flag in Stripe
    const stripe = this.stripeConfigService.getStripe(useConnectedAccount);
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    // Update in database
    await this.subscriptionRepository.update(id, {
      cancel_at_period_end: false,
    });

    console.log('🔄 Subscription renewal processed:', id);

    return {
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: false,
        current_period_end: subscription.current_period_end,
        plan: {
          name: subscription.plan?.name || 'Unknown',
        },
      },
    };
  }

  async getActivePlans() {
    const plans = await this.planRepository.find({
      where: { is_active: true },
      order: { price: 'ASC' },
    });

    return {
      success: true,
      plans: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        interval_count: plan.interval_count,
        features: plan.features,
        stripe_price_id: plan.stripe_price_id,
      })),
    };
  }
}