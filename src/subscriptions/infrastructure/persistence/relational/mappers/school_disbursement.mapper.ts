// school_disbursements/infrastructure/persistence/relational/mappers/school_disbursement.mapper.ts
import { SchoolDisbursementEntity } from '../entities/school_disbursement.entity';
import { SchoolDisbursement } from '../../../../domain/school_disbursement';
import { StudentMapper } from '../../../../../students/infrastructure/persistence/relational/mappers/student.mapper';
import { PaymentTermMapper } from './payment_term.mapper';
import { StudentPaymentMapper } from './student_payment.mapper';

export class SchoolDisbursementMapper {
  static toDomain(raw: SchoolDisbursementEntity): SchoolDisbursement {
    const disbursement = new SchoolDisbursement();

    disbursement.id = raw.id;
    disbursement.student = raw.student
      ? StudentMapper.toDomain(raw.student)
      : null;
    disbursement.term = raw.term ? PaymentTermMapper.toDomain(raw.term) : null;
    disbursement.payment = raw.payment
      ? StudentPaymentMapper.toDomain(raw.payment)
      : null;
    disbursement.bankPaybill = raw.bank_paybill;
    disbursement.accountNumber = raw.account_number;
    disbursement.amountDisbursed = raw.amount_disbursed;
    disbursement.disbursementType = raw.disbursement_type;
    disbursement.transactionId = raw.transaction_id;
    disbursement.status = raw.status;
    disbursement.createdAt = raw.created_at;

    return disbursement;
  }

  static toPersistence(
    disbursement: SchoolDisbursement,
  ): SchoolDisbursementEntity {
    const entity = new SchoolDisbursementEntity();

    if (disbursement.id) {
      entity.id = disbursement.id;
    }

    entity.student = disbursement.student
      ? ({ id: disbursement.student.id } as any)
      : null;
    entity.term = disbursement.term
      ? ({ id: disbursement.term.id } as any)
      : null;
    entity.payment = disbursement.payment
      ? ({ id: disbursement.payment.id } as any)
      : null;
    entity.bank_paybill = disbursement.bankPaybill;
    entity.account_number = disbursement.accountNumber;
    entity.amount_disbursed = disbursement.amountDisbursed;
    entity.disbursement_type = disbursement.disbursementType;
    entity.transaction_id = disbursement.transactionId;
    entity.status = disbursement.status;

    return entity;
  }
}
