import { TermCommissionEntity } from '../entities/term_commission.entity';
import { TermCommission } from '../../../../domain/term_commission';
import { StudentMapper } from '../../../../../students/infrastructure/persistence/relational/mappers/student.mapper';
import { PaymentTermMapper } from './payment_term.mapper';

export class TermCommissionMapper {
  static toDomain(raw: TermCommissionEntity): TermCommission {
    const termCommission = new TermCommission();

    termCommission.id = raw.id;
    termCommission.student = raw.student
      ? StudentMapper.toDomain(raw.student)
      : null;
    termCommission.term = raw.term
      ? PaymentTermMapper.toDomain(raw.term)
      : null;
    termCommission.commissionAmount = raw.commission_amount;
    termCommission.isPaid = raw.is_paid;
    termCommission.paidAt = raw.paid_at;
    termCommission.createdAt = raw.created_at;

    return termCommission;
  }

  static toPersistence(termCommission: TermCommission): TermCommissionEntity {
    const entity = new TermCommissionEntity();

    if (termCommission.id) {
      entity.id = termCommission.id;
    }

    entity.student = termCommission.student
      ? ({ id: termCommission.student.id } as any)
      : null;
    entity.term = termCommission.term
      ? ({ id: termCommission.term.id } as any)
      : null;
    entity.commission_amount = termCommission.commissionAmount;
    entity.is_paid = termCommission.isPaid;
    entity.paid_at = termCommission.paidAt;

    return entity;
  }
}
