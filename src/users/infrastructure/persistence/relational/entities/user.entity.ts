// users/infrastructure/persistence/relational/entities/user.entity.ts
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { AuthProvidersEnum } from '../../../../../auth/auth-providers.enum';
import { FileEntity } from '../../../../../files/infrastructure/persistence/relational/entities/file.entity';
import { RoleEntity } from '../../../../../roles/infrastructure/persistence/relational/entities/role.entity';
import { StatusEntity } from '../../../../../statuses/infrastructure/persistence/relational/entities/status.entity';
import { KYCEntity } from '../../../../../kyc/infrastructure/persistence/relational/entities/kyc.entity';
import { StudentEntity } from '../../../../../students/infrastructure/persistence/relational/entities/student.entity';
import { VehicleEntity } from '../../../../../vehicles/infrastructure/persistence/relational/entities/vehicle.entity';
import { RideEntity } from '../../../../../rides/infrastructure/persistence/relational/entities/ride.entity';
import { DailyRideEntity } from '../../../../../daily_rides/infrastructure/persistence/relational/entities/daily_ride.entity';
import { PaymentEntity } from '../../../../../payments/infrastructure/persistence/relational/entities/payment.entity';
import { NotificationEntity } from '../../../../../notifications/infrastructure/persistence/relational/entities/notification.entity';
import { LocationEntity } from '../../../../../location/infrastructure/persistence/relational/entities/location.entity';

export type UserKind = 'Parent' | 'Driver' | 'Admin';

export type UserMeta = {
  payments: {
    kind: 'Bank' | 'M-Pesa';
    bank: string | null;
    account_number: string | null;
    account_name: string | null;
  };
  county: string | null;
  neighborhood: string | null;
  notifications: {
    when_bus_leaves: boolean;
    when_bus_makes_home_drop_off: boolean;
    when_bus_make_home_pickup: boolean;
    when_bus_arrives: boolean;
    when_bus_is_1km_away: boolean;
    when_bus_is_0_5km_away: boolean;
  };
};

@Entity({ name: 'user' })
export class UserEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email: string | null;

  @Column({ nullable: true })
  password?: string;

  @Column({ default: AuthProvidersEnum.email })
  provider: string;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  socialId?: string | null;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  firstName: string | null;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone_number: string | null;

  @Column({ type: 'varchar', nullable: true })
  push_token: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
    enum: ['Parent', 'Driver', 'Admin'],
  })
  kind: UserKind;

  @Column({ type: 'jsonb', nullable: true })
  meta: UserMeta | null;

  @Column({ type: 'float', default: 0 })
  wallet_balance: number;

  @Column({ type: 'boolean', default: false })
  is_kyc_verified: boolean;

  @OneToOne(() => FileEntity, { eager: true })
  @JoinColumn()
  photo?: FileEntity | null;

  @ManyToOne(() => RoleEntity, { eager: true })
  role?: RoleEntity | null;

  @ManyToOne(() => StatusEntity, { eager: true })
  status?: StatusEntity;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  // Relationships
  @OneToOne(() => KYCEntity, (kyc) => kyc.user, { nullable: true })
  kyc?: KYCEntity | null;

  @OneToMany(() => StudentEntity, (student) => student.parent)
  students: StudentEntity[];

  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.user)
  vehicles: VehicleEntity[];

  @OneToMany(() => RideEntity, (ride) => ride.driver)
  driver_rides: RideEntity[];

  @OneToMany(() => RideEntity, (ride) => ride.parent)
  parent_rides: RideEntity[];

  @OneToMany(() => DailyRideEntity, (dailyRide) => dailyRide.driver)
  daily_rides: DailyRideEntity[];

  @OneToMany(() => PaymentEntity, (payment) => payment.user)
  payments: PaymentEntity[];

  @OneToMany(() => NotificationEntity, (notification) => notification.user)
  notifications: NotificationEntity[];

  @OneToMany(() => LocationEntity, (location) => location.driver)
  locations: LocationEntity[];
}
