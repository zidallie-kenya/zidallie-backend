// notification/infrastructure/persistence/relational/entities/notification.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import {
  NotificationKind,
  NotificationSection,
} from '../../../../../utils/types/enums';

@Entity({ name: 'notification' })
export class NotificationEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.notifications, {
    nullable: false,
  })
  user: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'senderId' })
  sender: UserEntity;

  @Column({ type: 'text', nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  meta: any | null;

  @Column({ type: 'boolean', nullable: false, default: false })
  is_read: boolean;

  @Column({
    type: 'varchar',
    length: 10,
    enum: NotificationKind,
    nullable: false,
  })
  kind: NotificationKind;

  @Column({
    type: 'varchar',
    length: 20,
    enum: NotificationSection,
    nullable: false,
  })
  section: NotificationSection;

  @CreateDateColumn()
  created_at: Date;
}
