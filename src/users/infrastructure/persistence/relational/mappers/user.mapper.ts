import { RoleEntity } from '../../../../../roles/infrastructure/persistence/relational/entities/role.entity';
import { StatusEntity } from '../../../../../statuses/infrastructure/persistence/relational/entities/status.entity';
import { User } from '../../../../domain/user';
import { UserEntity } from '../entities/user.entity';

export class UserMapper {
  static toDomain(raw: UserEntity): User {
    const domainEntity = new User();
    domainEntity.id = raw.id;
    domainEntity.email = raw.email;
    domainEntity.password = raw.password;
    domainEntity.provider = raw.provider;
    domainEntity.socialId = raw.socialId;
    domainEntity.firstName = raw.firstName;
    domainEntity.lastName = raw.lastName;
    domainEntity.name = raw.name;
    domainEntity.phone_number = raw.phone_number;
    domainEntity.push_token = raw.push_token;
    domainEntity.kind = raw.kind;
    domainEntity.meta = raw.meta;
    domainEntity.wallet_balance = raw.wallet_balance;
    domainEntity.is_kyc_verified = raw.is_kyc_verified;
    domainEntity.photo = raw.photo;
    domainEntity.role = raw.role;
    domainEntity.status = raw.status;
    domainEntity.school_id = raw.school_id;
    domainEntity.created_at = raw.created_at;
    domainEntity.updated_at = raw.updated_at;
    domainEntity.deleted_at = raw.deleted_at;
    return domainEntity;
  }

  static toPersistence(domainEntity: Partial<User>): Partial<UserEntity> {
    const persistence: Partial<UserEntity> = {};

    if (domainEntity.id !== undefined) persistence.id = domainEntity.id;
    if (domainEntity.photo !== undefined)
      persistence.photo = domainEntity.photo;

    if (domainEntity.role !== undefined && domainEntity.role !== null) {
      const role = new RoleEntity();
      role.id = Number(domainEntity.role.id);
      persistence.role = role;
    }

    if (domainEntity.status !== undefined && domainEntity.status !== null) {
      const status = new StatusEntity();
      status.id = Number(domainEntity.status.id);
    }

    if (domainEntity.email !== undefined)
      persistence.email = domainEntity.email;
    if (domainEntity.password != undefined)
      persistence.password = domainEntity.password;
    if (domainEntity.provider !== undefined)
      persistence.provider = domainEntity.provider;
    if (domainEntity.socialId !== undefined)
      persistence.socialId = domainEntity.socialId;
    if (domainEntity.firstName !== undefined)
      persistence.firstName = domainEntity.firstName;
    if (domainEntity.lastName !== undefined)
      persistence.lastName = domainEntity.lastName;
    if (domainEntity.name !== undefined) persistence.name = domainEntity.name;
    if (domainEntity.phone_number !== undefined)
      persistence.phone_number = domainEntity.phone_number;
    if (domainEntity.push_token !== undefined)
      persistence.push_token = domainEntity.push_token;
    if (domainEntity.kind !== undefined) persistence.kind = domainEntity.kind;
    if (domainEntity.meta !== undefined) persistence.meta = domainEntity.meta;
    if (domainEntity.wallet_balance !== undefined)
      persistence.wallet_balance = domainEntity.wallet_balance;
    if (domainEntity.is_kyc_verified !== undefined)
      persistence.is_kyc_verified = domainEntity.is_kyc_verified;
    if (domainEntity.school_id !== undefined)
      persistence.school_id = domainEntity.school_id;

    return persistence;
  }
}
