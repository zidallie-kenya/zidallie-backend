import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1786996364637 implements MigrationInterface {
  name = 'InitialMigration1786996364637';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "daily_ride" ADD "start_latitude" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_ride" ADD "start_longitude" double precision`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "daily_ride" DROP COLUMN "start_longitude"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_ride" DROP COLUMN "start_latitude"`,
    );
  }
}
