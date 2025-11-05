import { SubscriptionPlan } from '../../subscriptions/domain/subscription-plan';
import { Student } from '../../students/domain/student';

export class Subscription {
  id: number;
  start_date: Date;
  expiry_date: Date;
  amount: number;
  status: string;
  created_at: Date;
  updated_at: Date;

  // Relations
  plan?: SubscriptionPlan | null;
  student?: Student | null;
}
