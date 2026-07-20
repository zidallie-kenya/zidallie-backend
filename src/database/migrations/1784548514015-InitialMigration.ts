import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1784548514015 implements MigrationInterface {
  name = 'InitialMigration1784548514015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transport_pricing" DROP COLUMN "max_km"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_pricing" ADD "max_km" numeric(6,2) NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transport_pricing" DROP COLUMN "max_km"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_pricing" ADD "max_km" integer NOT NULL`,
    );
  }
}
