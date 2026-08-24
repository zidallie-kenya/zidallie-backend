import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1787575485972 implements MigrationInterface {
  name = 'InitialMigration1787575485972';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transport_booking" ADD "discount_code_applied" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking" ADD "discount_amount_applied" numeric(10,2) DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transport_booking" DROP COLUMN "discount_amount_applied"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking" DROP COLUMN "discount_code_applied"`,
    );
  }
}
