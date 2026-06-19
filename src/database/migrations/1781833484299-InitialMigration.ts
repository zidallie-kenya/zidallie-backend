import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1781833484299 implements MigrationInterface {
  name = 'InitialMigration1781833484299';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "phone_number"`);
    await queryRunner.query(
      `ALTER TABLE "pending_payments" DROP COLUMN "dailyRideId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_cluster" ADD "seat_capacity" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "service_type"`);
    await queryRunner.query(
      `ALTER TABLE "student" ADD "service_type" character varying(10)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "service_type"`);
    await queryRunner.query(
      `ALTER TABLE "student" ADD "service_type" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_cluster" DROP COLUMN "seat_capacity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ADD "dailyRideId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" ADD "phone_number" character varying(20)`,
    );
  }
}
