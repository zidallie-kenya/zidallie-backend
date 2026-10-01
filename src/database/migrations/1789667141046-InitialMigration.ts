import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1789667141046 implements MigrationInterface {
  name = 'InitialMigration1789667141046';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transport_booking" ADD "year" numeric`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transport_booking" DROP COLUMN "year"`,
    );
  }
}
