import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { UserSubscription } from '../../subscription/entities/user-subscription.entity';

@Entity('subscription_payments')
export class SubscriptionPayment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  subscription_id: number;

  @Column({ nullable: true, unique: true })
  stripe_invoice_id: string;

  @Column({ nullable: true })
  stripe_payment_intent_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'usd' })
  currency: string;

  @Column()
  status: string; // 'succeeded', 'failed', 'pending'

  @Column({ type: 'timestamp', nullable: true })
  payment_date: Date;

  @Column({ nullable: true })
  hosted_invoice_url: string;

  @Column({ nullable: true })
  invoice_pdf: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => UserSubscription, subscription => subscription.payments)
  subscription: UserSubscription;
}