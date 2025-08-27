import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { mapRelation } from '../../../../../utils/relation.mapper';
import { Payment } from '../../../../domain/payment';
import { PaymentEntity } from '../entities/payment.entity';

export class PaymentMapper {
  static toDomain(raw: PaymentEntity): Payment {
    const domainEntity = new Payment();
    domainEntity.id = raw.id;
    domainEntity.user = UserMapper.toDomain(raw.user);
    domainEntity.amount = raw.amount;
    domainEntity.kind = raw.kind;
    domainEntity.transaction_type = raw.transaction_type;
    domainEntity.comments = raw.comments;
    domainEntity.transaction_id = raw.transaction_id;
    domainEntity.created_at = raw.created_at;
    domainEntity.updated_at = raw.updated_at;
    return domainEntity;
  }

  static toPersistence(domainEntity: Partial<Payment>): Partial<PaymentEntity> {
    const persistence: Partial<PaymentEntity> = {};

    //simple fields
    if (domainEntity.id !== undefined) persistence.id = domainEntity.id;
    if (domainEntity.amount !== undefined)
      persistence.amount = domainEntity.amount;
    if (domainEntity.kind !== undefined) persistence.kind = domainEntity.kind;
    if (domainEntity.transaction_type !== undefined)
      persistence.transaction_type = domainEntity.transaction_type;
    if (domainEntity.comments !== undefined)
      persistence.comments = domainEntity.comments;
    if (domainEntity.transaction_id !== undefined)
      persistence.transaction_id = domainEntity.transaction_id;

    //relations
    persistence.user =
      (mapRelation(domainEntity.user, UserMapper) as UserEntity) || undefined;
    return persistence;
  }
}
