import { SubscriptionPlan } from '../../subscriptions/domain/subscription-plan';
import { Student } from '../../students/domain/student';

export class Subscription {
  id: number;
  start_date: Date;
  expiry_date: Date;
  amount: number;
  status: string;
  total_paid: number;
  balance: number;
  is_commission_paid: boolean;
  days_access?: number | null;
  last_payment_date?: Date | null;
  created_at: Date;
  updated_at: Date;

  // Relations
  student?: Student | null;
  plan?: SubscriptionPlan | null;
  term?: { id: number; name?: string } | null;

  constructor(params: Partial<Subscription>) {
    Object.assign(this, params);
  }
}
