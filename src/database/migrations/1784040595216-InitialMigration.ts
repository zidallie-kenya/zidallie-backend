import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1784040595216 implements MigrationInterface {
  name = 'InitialMigration1784040595216';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "service_type"`);
    await queryRunner.query(
      `ALTER TABLE "student" ADD "service_type" character varying(20)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "service_type"`);
    await queryRunner.query(
      `ALTER TABLE "student" ADD "service_type" character varying(10)`,
    );
  }
}
