import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1777504445501 implements MigrationInterface {
  name = 'InitialMigration1777504445501';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "daily_ride" ADD "earnings_processed" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "pending_earnings" double precision NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "payout" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "sasapay_account_number" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "ID_number" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "ID_number"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "sasapay_account_number"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "payout"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "pending_earnings"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_ride" DROP COLUMN "earnings_processed"`,
    );
  }
}
