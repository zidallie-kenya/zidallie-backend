import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1781839277740 implements MigrationInterface {
  name = 'InitialMigration1781839277740';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "student" ADD "phone_number" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ADD "dailyRideId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "pickup_station" ADD "latitude" numeric(15,8)`,
    );
    await queryRunner.query(
      `ALTER TABLE "pickup_station" ADD "longitude" numeric(15,8)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pickup_station" DROP COLUMN "longitude"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pickup_station" DROP COLUMN "latitude"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" DROP COLUMN "dailyRideId"`,
    );
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "phone_number"`);
  }
}
