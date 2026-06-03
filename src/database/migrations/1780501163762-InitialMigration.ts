import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1780501163762 implements MigrationInterface {
  name = 'InitialMigration1780501163762';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "emailOtp" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "emailOtpExpires" bigint`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "emailOtpExpires"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "emailOtp"`);
  }
}
