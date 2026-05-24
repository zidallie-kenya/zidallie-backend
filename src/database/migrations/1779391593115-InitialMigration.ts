import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1779391593115 implements MigrationInterface {
  name = 'InitialMigration1779391593115';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicle" ADD "vehicle_report" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicle" DROP COLUMN "vehicle_report"`,
    );
  }
}
