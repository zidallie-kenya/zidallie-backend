import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1779385004849 implements MigrationInterface {
  name = 'InitialMigration1779385004849';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicle" ADD "vehicle_report_url" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicle" DROP COLUMN "vehicle_report_url"`,
    );
  }
}
