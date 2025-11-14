import { Student } from '../../students/domain/student';
import { PaymentTerm } from './payment_term';

export class TermCommission {
  id: number;
  student: Student | null;
  term: PaymentTerm | null;
  commissionAmount: number;
  isPaid: boolean;
  paidAt: Date | null;
  createdAt: Date;
}
