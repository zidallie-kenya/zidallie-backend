import { PaymentTermEntity } from '../entities/payment_term.entity';
import { PaymentTerm } from '../../../../domain/payment_term';
import { SchoolMapper } from '../../../../../schools/infrastructure/persistence/relational/mappers/schools.mapper';

export class PaymentTermMapper {
  static toDomain(raw: PaymentTermEntity): PaymentTerm {
    const paymentTerm = new PaymentTerm();

    paymentTerm.id = raw.id;
    paymentTerm.school = raw.school ? SchoolMapper.toDomain(raw.school) : null;
    paymentTerm.name = raw.name;
    paymentTerm.startDate = raw.start_date;
    paymentTerm.endDate = raw.end_date;
    paymentTerm.isActive = raw.is_active;
    paymentTerm.createdAt = raw.created_at;
    paymentTerm.updatedAt = raw.updated_at;

    return paymentTerm;
  }

  static toPersistence(paymentTerm: PaymentTerm): PaymentTermEntity {
    const entity = new PaymentTermEntity();

    if (paymentTerm.id) {
      entity.id = paymentTerm.id;
    }

    entity.school = paymentTerm.school
      ? ({ id: paymentTerm.school.id } as any)
      : null;
    entity.name = paymentTerm.name;
    entity.start_date = paymentTerm.startDate;
    entity.end_date = paymentTerm.endDate;
    entity.is_active = paymentTerm.isActive;

    return entity;
  }
}
