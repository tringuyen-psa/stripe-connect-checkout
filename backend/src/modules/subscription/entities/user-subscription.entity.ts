import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { SubscriptionPlan } from '../../subscription-plan/entities/subscription-plan.entity';
import { SubscriptionPayment } from '../../payment/entities/subscription-payment.entity';

@Entity('user_subscriptions')
export class UserSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  plan_id: number;

  @Column({ unique: true })
  stripe_subscription_id: string;

  @Column({ nullable: true })
  stripe_customer_id: string;

  @Column()
  status: string; // 'active', 'canceled', 'past_due', 'unpaid', 'trialing'

  @Column({ type: 'timestamp', nullable: true })
  current_period_start: Date;

  @Column({ type: 'timestamp', nullable: true })
  current_period_end: Date;

  @Column({ default: false })
  cancel_at_period_end: boolean;

  @Column({ type: 'timestamp', nullable: true })
  trial_start: Date;

  @Column({ type: 'timestamp', nullable: true })
  trial_end: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'usd' })
  currency: string;

  @Column()
  interval: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, user => user.subscriptions)
  user: User;

  @ManyToOne(() => SubscriptionPlan, plan => plan.subscriptions)
  plan: SubscriptionPlan;

  @OneToMany(() => SubscriptionPayment, payment => payment.subscription)
  payments: SubscriptionPayment[];

  // Virtual fields for response
  plan_name?: string;
  plan_description?: string;
  plan_features?: any;
}