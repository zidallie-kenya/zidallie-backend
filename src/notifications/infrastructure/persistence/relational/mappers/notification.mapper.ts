import { Notification } from '../../../../domain/notification';
import { NotificationEntity } from '../entities/notification.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { DeepPartial } from '../../../../../utils/types/deep-partial.type';
import { mapRelation } from '../../../../../utils/relation.mapper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';

export class NotificationMapper {
  static toDomain(raw: NotificationEntity): Notification {
    const domainEntity = new Notification();
    domainEntity.id = raw.id;
    domainEntity.user = UserMapper.toDomain(raw.user);
    domainEntity.sender = raw.sender;
    domainEntity.receiver = raw.receiver;
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
  ): Partial<NotificationEntity> {
    const persistence: Partial<NotificationEntity> = {};

    if (domainEntity.id !== undefined) {
      persistence.id = domainEntity.id;
    }

    if (domainEntity.sender !== undefined) {
      persistence.sender = domainEntity.sender;
    }

    if (domainEntity.receiver !== undefined) {
      persistence.receiver = domainEntity.receiver;
    }
    if (domainEntity.title !== undefined) {
      persistence.title = domainEntity.title;
    }

    if (domainEntity.message !== undefined) {
      persistence.message = domainEntity.message;
    }

    if (domainEntity.meta !== undefined) {
      persistence.meta = domainEntity.meta;
    }

    if (domainEntity.is_read !== undefined) {
      persistence.is_read = domainEntity.is_read;
    }

    if (domainEntity.kind !== undefined) {
      persistence.kind = domainEntity.kind;
    }

    if (domainEntity.section !== undefined) {
      persistence.section = domainEntity.section;
    }

    if (domainEntity.user !== undefined) {
      persistence.user =
        (mapRelation(domainEntity.user, UserMapper) as UserEntity) || undefined;
    }

    return persistence;
  }
}
