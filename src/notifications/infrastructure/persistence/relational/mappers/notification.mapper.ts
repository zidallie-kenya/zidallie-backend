import { Notification } from '../../../../domain/notification';
import { NotificationEntity } from '../entities/notification.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { DeepPartial } from '../../../../../utils/types/deep-partial.type';
import { User } from '../../../../../users/domain/user';

export class NotificationMapper {
  static toDomain(raw: NotificationEntity): Notification {
    const domainEntity = new Notification();
    domainEntity.id = raw.id;
    // domainEntity.user = UserMapper.toDomain(raw.user);
    domainEntity.user = { id: raw.user?.id } as any;
    domainEntity.sender = { id: raw.sender?.id } as any;
    domainEntity.title = raw.title;
    domainEntity.message = raw.message;
    domainEntity.meta = raw.meta;
    domainEntity.is_read = raw.is_read;
    domainEntity.kind = raw.kind;
    domainEntity.section = raw.section;
    domainEntity.created_at = raw.created_at;
    return domainEntity;
  }

  static toPersistence(
    domainEntity: DeepPartial<Notification>,
  ): NotificationEntity {
    const persistenceEntity = new NotificationEntity();

    if (domainEntity.id !== undefined) {
      persistenceEntity.id = domainEntity.id;
    }

    if (domainEntity.user?.id !== undefined) {
      persistenceEntity.user = UserMapper.toPersistence(
        domainEntity.user as User,
      );
    }

    if (domainEntity.sender?.id !== undefined) {
      persistenceEntity.sender = UserMapper.toPersistence(
        domainEntity.sender as User,
      );
    }

    if (domainEntity.title !== undefined) {
      persistenceEntity.title = domainEntity.title;
    }

    if (domainEntity.message !== undefined) {
      persistenceEntity.message = domainEntity.message;
    }

    if (domainEntity.meta !== undefined) {
      persistenceEntity.meta = domainEntity.meta;
    }

    if (domainEntity.is_read !== undefined) {
      persistenceEntity.is_read = domainEntity.is_read;
    }

    if (domainEntity.kind !== undefined) {
      persistenceEntity.kind = domainEntity.kind;
    }

    if (domainEntity.section !== undefined) {
      persistenceEntity.section = domainEntity.section;
    }

    if (domainEntity.created_at instanceof Date) {
      persistenceEntity.created_at = domainEntity.created_at;
    }

    return persistenceEntity;
  }
}
