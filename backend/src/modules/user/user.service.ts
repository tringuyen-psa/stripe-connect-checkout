import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { StripeConfigService } from '../../config/stripe.config';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private stripeConfigService: StripeConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, name } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      return existingUser;
    }

    // Create new user
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async createWithStripe(createUserDto: CreateUserDto, paymentMethodId?: string): Promise<User> {
    const { email, name } = createUserDto;

    // Check if user already exists
    let user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Create Stripe customer
      const stripe = this.stripeConfigService.getStripe();
      const customerData: any = {
        email,
        name,
      };

      if (paymentMethodId) {
        customerData.payment_method = paymentMethodId;
        customerData.invoice_settings = {
          default_payment_method: paymentMethodId,
        };
      }

      const stripeCustomer = await stripe.customers.create(customerData);

      // Create user with Stripe customer ID
      user = this.userRepository.create({
        email,
        name,
        stripe_customer_id: stripeCustomer.id,
      });

      user = await this.userRepository.save(user);
      console.log('👤 Created new user with Stripe customer:', user.id, user.stripe_customer_id);
    } else {
      console.log('👤 Found existing user:', user.id, user.stripe_customer_id);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async findByStripeCustomerId(stripe_customer_id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { stripe_customer_id },
    });
  }

  async findById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
      relations: ['subscriptions'],
    });
  }

  async updateStripeCustomerId(id: number, stripe_customer_id: string): Promise<User> {
    await this.userRepository.update(id, { stripe_customer_id });
    return await this.findById(id);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      relations: ['subscriptions'],
    });
  }
}