import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'carpool_school' })
export class CarpoolSchoolEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  region!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
