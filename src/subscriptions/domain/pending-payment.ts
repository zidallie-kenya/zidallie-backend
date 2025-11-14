export class PendingPayment {
  id?: number;
  studentId: number;
  termId?: number | null;
  subscriptionPlanId: number;
  amount: number;
  checkoutId: string;
  phoneNumber?: string | null;
  paymentType?:
    | 'initial'
    | 'installment'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'termly'
    | null;
  paymentModel?: 'daily' | 'term' | 'zidallie' | null;
  schoolId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(params: {
    id?: number;
    studentId: number;
    termId?: number | null;
    subscriptionPlanId: number;
    amount: number;
    checkoutId: string;
    phoneNumber?: string | null;
    paymentType?:
      | 'initial'
      | 'installment'
      | 'daily'
      | 'weekly'
      | 'monthly'
      | 'termly'
      | null;
    paymentModel?: 'daily' | 'term' | 'zidallie' | null;
    schoolId?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = params.id;
    this.studentId = params.studentId;
    this.termId = params.termId ?? null;
    this.subscriptionPlanId = params.subscriptionPlanId;
    this.amount = params.amount;
    this.checkoutId = params.checkoutId;
    this.phoneNumber = params.phoneNumber ?? null;
    this.paymentType = params.paymentType ?? null;
    this.paymentModel = params.paymentModel ?? null;
    this.schoolId = params.schoolId ?? null;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }
}
