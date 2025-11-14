import { Student } from '../../students/domain/student';
import { PaymentTerm } from './payment_term';
import { StudentPayment } from './student_payment';

export type DisbursementType = 'B2C' | 'B2B';
export type DisbursementStatus = 'pending' | 'completed' | 'failed';

export class SchoolDisbursement {
  id: number;
  student: Student | null;
  term: PaymentTerm | null;
  payment: StudentPayment | null;
  bankPaybill: string | null;
  accountNumber: string | null;
  amountDisbursed: number;
  disbursementType: DisbursementType;
  transactionId: string | null;
  status: DisbursementStatus;
  createdAt: Date;
}
