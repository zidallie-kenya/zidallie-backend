import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { mapRelation } from '../../../../../utils/relation.mapper';
import { KYC } from '../../../../domain/kyc';
import { KYCEntity } from '../entities/kyc.entity';

export class KYCMapper {
  static toDomain(raw: KYCEntity): KYC {
    const domainEntity = new KYC();
    domainEntity.id = raw.id;
    domainEntity.national_id_front = raw.national_id_front;
    domainEntity.national_id_back = raw.national_id_back;
    domainEntity.passport_photo = raw.passport_photo;
    domainEntity.driving_license = raw.driving_license;
    domainEntity.certificate_of_good_conduct = raw.certificate_of_good_conduct;
    domainEntity.created_at = raw.created_at;
    domainEntity.updated_at = raw.updated_at;
    domainEntity.comments = raw.comments;
    domainEntity.is_verified = raw.is_verified;
    if (raw.user) {
      domainEntity.user = UserMapper.toDomain(raw.user);
    }
    return domainEntity;
  }

  static toPersistence(domainEntity: Partial<KYC>): Partial<KYCEntity> {
    const persistence: Partial<KYCEntity> = {};

    //simple fields
    if (domainEntity.id !== undefined) persistence.id = domainEntity.id;
    if (domainEntity.national_id_front !== undefined)
      persistence.national_id_front = domainEntity.national_id_front;
    if (domainEntity.national_id_back !== undefined)
      persistence.national_id_back = domainEntity.national_id_back;
    if (domainEntity.passport_photo !== undefined)
      persistence.passport_photo = domainEntity.passport_photo;
    if (domainEntity.driving_license !== undefined)
      persistence.driving_license = domainEntity.driving_license;
    if (domainEntity.certificate_of_good_conduct !== undefined)
      persistence.certificate_of_good_conduct =
        domainEntity.certificate_of_good_conduct;
    if (domainEntity.comments !== undefined)
      persistence.comments = domainEntity.comments;
    if (domainEntity.is_verified !== undefined)
      persistence.is_verified = domainEntity.is_verified;

    //relations
    //user
    persistence.user =
      (mapRelation(domainEntity.user, UserMapper) as UserEntity) || undefined;

    return persistence;
  }
}
