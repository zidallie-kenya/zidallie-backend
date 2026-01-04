import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1767534898296 implements MigrationInterface {
  name = 'InitialMigration1767534898296';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "term_total_paid" double precision NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "commission_paid_amount" double precision NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "commission_paid_amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "term_total_paid"`,
    );
  }
}
