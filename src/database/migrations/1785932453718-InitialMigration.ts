import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1785932453718 implements MigrationInterface {
  name = 'InitialMigration1785932453718';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "student" ADD "emergency_contact" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "student" DROP COLUMN "emergency_contact"`,
    );
  }
}
