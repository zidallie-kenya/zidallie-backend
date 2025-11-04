export class PendingPayment {
  id?: number;
  studentId: number;
  subscriptionPlanId: number;
  amount: number;
  checkoutId: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(params: {
    studentId: number;
    subscriptionPlanId: number;
    amount: number;
    checkoutId: string;
    id?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.studentId = params.studentId;
    this.subscriptionPlanId = params.subscriptionPlanId;
    this.amount = params.amount;
    this.checkoutId = params.checkoutId;
    this.id = params.id;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }
}
