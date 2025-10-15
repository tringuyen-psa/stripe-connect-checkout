import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserSubscription } from '../../subscription/entities/user-subscription.entity';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'usd' })
  currency: string;

  @Column()
  interval: string; // 'month', 'year', 'week', 'day'

  @Column({ default: 1 })
  interval_count: number;

  @Column({ nullable: true })
  stripe_price_id: string;

  @Column({ nullable: true })
  stripe_product_id: string;

  @Column({ type: 'jsonb', nullable: true })
  features: Record<string, any>;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => UserSubscription, subscription => subscription.plan)
  subscriptions: UserSubscription[];
}