import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1787139212435 implements MigrationInterface {
  name = 'InitialMigration1787139212435';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "student" ADD "discount_code_amount" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" ADD "discount_code" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" ADD "discount_code_expiry" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "student" DROP COLUMN "discount_code_expiry"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" DROP COLUMN "discount_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" DROP COLUMN "discount_code_amount"`,
    );
  }
}
