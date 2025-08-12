import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
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

  static toPersistence(domainEntity: Payment): PaymentEntity {
    let user: UserEntity | null = null;
    if (domainEntity.user) {
      user = UserMapper.toPersistence(domainEntity.user);
    }

    const persistenceEntity = new PaymentEntity();
    if (domainEntity.id && typeof domainEntity.id === 'number') {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.user = user as UserEntity;
    persistenceEntity.amount = domainEntity.amount;
    persistenceEntity.kind = domainEntity.kind;
    persistenceEntity.transaction_type = domainEntity.transaction_type;
    persistenceEntity.comments = domainEntity.comments;
    persistenceEntity.transaction_id = domainEntity.transaction_id;
    persistenceEntity.created_at = domainEntity.created_at;
    persistenceEntity.updated_at = domainEntity.updated_at;
    return persistenceEntity;
  }
}
