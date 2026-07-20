import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1784544622069 implements MigrationInterface {
  name = 'InitialMigration1784544622069';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "carpool_school" ADD "latitude" numeric(10,7)`,
    );
    await queryRunner.query(
      `ALTER TABLE "carpool_school" ADD "longitude" numeric(10,7)`,
    );
    await queryRunner.query(
      `ALTER TABLE "bus_school" ADD "latitude" numeric(10,7)`,
    );
    await queryRunner.query(
      `ALTER TABLE "bus_school" ADD "longitude" numeric(10,7)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bus_school" DROP COLUMN "longitude"`);
    await queryRunner.query(`ALTER TABLE "bus_school" DROP COLUMN "latitude"`);
    await queryRunner.query(
      `ALTER TABLE "carpool_school" DROP COLUMN "longitude"`,
    );
    await queryRunner.query(
      `ALTER TABLE "carpool_school" DROP COLUMN "latitude"`,
    );
  }
}
