import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1758350445026 implements MigrationInterface {
  name = 'InitialMigration1758350445026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "daily_ride" ADD "embark_time" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_ride" ADD "disembark_time" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "daily_ride" DROP COLUMN "disembark_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_ride" DROP COLUMN "embark_time"`,
    );
  }
}
