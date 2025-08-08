import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
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

  static toPersistence(domainEntity: Partial<KYC>): KYCEntity {
    let user: UserEntity | null = null;

    if (domainEntity.user) {
      user = UserMapper.toPersistence(domainEntity.user);
    }

    const persistenceEntity = new KYCEntity();
    if (domainEntity.id && typeof domainEntity.id === 'number') {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.national_id_front = domainEntity.national_id_front ?? '';
    persistenceEntity.national_id_back = domainEntity.national_id_back ?? '';
    persistenceEntity.passport_photo = domainEntity.passport_photo ?? '';
    persistenceEntity.driving_license = domainEntity.driving_license ?? '';
    persistenceEntity.certificate_of_good_conduct =
      domainEntity.certificate_of_good_conduct ?? '';
    persistenceEntity.created_at = domainEntity.created_at ?? new Date();
    persistenceEntity.updated_at = domainEntity.updated_at ?? new Date();
    persistenceEntity.comments = domainEntity.comments ?? '';
    persistenceEntity.is_verified = domainEntity.is_verified ?? false;
    persistenceEntity.user = user;
    return persistenceEntity;
  }
}
