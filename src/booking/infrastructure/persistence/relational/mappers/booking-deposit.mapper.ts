import { BookingDeposit } from '../../../../domain/booking-deposit';
import { BookingDepositEntity } from '../entities/booking-deposit.entity';

export class BookingDepositMapper {
  static toDomain(entity: BookingDepositEntity): BookingDeposit {
    return new BookingDeposit({
      id: entity.id,
      booking_id: entity.booking?.id,
      parent_id: entity.parent?.id,
      amount: Number(entity.amount),
      phone_number: entity.phone_number,
      checkout_request_id: entity.checkout_request_id,
      status: entity.status,
      mpesa_transaction_id: entity.mpesa_transaction_id,
      payment_type: entity.payment_type,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    });
  }

  static toPersistence(domain: BookingDeposit): Partial<BookingDepositEntity> {
    const entity = new BookingDepositEntity();
    if (domain.id) entity.id = domain.id;
    entity.amount = domain.amount;
    entity.phone_number = domain.phone_number;
    entity.checkout_request_id = domain.checkout_request_id;
    entity.status = domain.status as any;
    entity.mpesa_transaction_id = domain.mpesa_transaction_id;
    entity.payment_type = domain.payment_type;
    return entity;
  }
}
