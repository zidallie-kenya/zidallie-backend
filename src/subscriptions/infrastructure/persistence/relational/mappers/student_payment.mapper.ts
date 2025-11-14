// student_payments/infrastructure/persistence/relational/mappers/student_payment.mapper.ts
import { StudentPaymentEntity } from '../entities/student_payment.entity';
import { StudentPayment } from '../../../../domain/student_payment';
import { StudentMapper } from '../../../../../students/infrastructure/persistence/relational/mappers/student.mapper';
import { PaymentTermMapper } from './payment_term.mapper';

export class StudentPaymentMapper {
  static toDomain(raw: StudentPaymentEntity): StudentPayment {
    const studentPayment = new StudentPayment();

    studentPayment.id = raw.id;
    studentPayment.student = raw.student
      ? StudentMapper.toDomain(raw.student)
      : null;
    studentPayment.term = raw.term
      ? PaymentTermMapper.toDomain(raw.term)
      : null;
    studentPayment.transactionId = raw.transaction_id;
    studentPayment.phoneNumber = raw.phone_number;
    studentPayment.amountPaid = raw.amount_paid;
    studentPayment.paymentType = raw.payment_type;
    studentPayment.createdAt = raw.created_at;

    return studentPayment;
  }

  static toPersistence(studentPayment: StudentPayment): StudentPaymentEntity {
    const entity = new StudentPaymentEntity();

    if (studentPayment.id) {
      entity.id = studentPayment.id;
    }

    entity.student = studentPayment.student
      ? ({ id: studentPayment.student.id } as any)
      : null;
    entity.term = studentPayment.term
      ? ({ id: studentPayment.term.id } as any)
      : null;
    entity.transaction_id = studentPayment.transactionId;
    entity.phone_number = studentPayment.phoneNumber;
    entity.amount_paid = studentPayment.amountPaid;
    entity.payment_type = studentPayment.paymentType;

    return entity;
  }
}
