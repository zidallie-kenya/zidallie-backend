import { Student } from '../../students/domain/student';
import { PaymentTerm } from './payment_term';

export type PaymentType =
  | 'initial'
  | 'installment'
  | 'daily'
  | 'weekly'
  | 'monthly';

export class StudentPayment {
  id: number;
  student: Student | null;
  term: PaymentTerm | null;
  transactionId: string;
  phoneNumber: string;
  amountPaid: number;
  paymentType: PaymentType;
  createdAt: Date;
}
