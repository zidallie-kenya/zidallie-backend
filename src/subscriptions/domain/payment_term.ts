import { School } from '../../schools/domain/schools';

export class PaymentTerm {
  id: number;
  school: School | null;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
