import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1770528995294 implements MigrationInterface {
  name = 'InitialMigration1770528995294';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "student_payments" ADD CONSTRAINT "UQ_d515e0120134fc76124a7f708a5" UNIQUE ("transaction_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_829223965821ce99f42765f6ab" ON "school_disbursements" ("paymentId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_829223965821ce99f42765f6ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_payments" DROP CONSTRAINT "UQ_d515e0120134fc76124a7f708a5"`,
    );
  }
}
