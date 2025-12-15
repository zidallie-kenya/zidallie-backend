import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'account_balance_callbacks' })
export class AccountBalanceCallbackEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // e.g. "AccountBalance"
  @Column({ type: 'varchar', length: 100, nullable: false })
  account_type: string;

  // Parsed from BOCompletedTime (20251203105904)
  @Column({ type: 'timestamp', nullable: true })
  completed_time: Date | null;

  // The full Safaricom callback response JSON
  @Column({ type: 'jsonb', nullable: true })
  raw_result: Record<string, any> | null;

  @CreateDateColumn()
  created_at: Date;
}
