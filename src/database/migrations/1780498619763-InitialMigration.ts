import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1780498619763 implements MigrationInterface {
  name = 'InitialMigration1780498619763';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "last_earnings_reset_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "last_earnings_reset_at"`,
    );
  }
}
