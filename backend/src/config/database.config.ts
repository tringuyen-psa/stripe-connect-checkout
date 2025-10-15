import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../modules/user/entities/user.entity';
import { SubscriptionPlan } from '../modules/subscription-plan/entities/subscription-plan.entity';
import { UserSubscription } from '../modules/subscription/entities/user-subscription.entity';
import { SubscriptionPayment } from '../modules/payment/entities/subscription-payment.entity';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  return {
    type: 'postgres',
    url: databaseUrl,
    entities: [User, SubscriptionPlan, UserSubscription, SubscriptionPayment],
    synchronize: true, // Set to false in production
    logging: configService.get<string>('NODE_ENV') === 'development',
    ssl: configService.get<string>('NODE_ENV') === 'production'
      ? { rejectUnauthorized: false }
      : false,
  };
};