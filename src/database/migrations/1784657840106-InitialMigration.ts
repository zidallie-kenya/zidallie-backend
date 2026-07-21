import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1784657840106 implements MigrationInterface {
  name = 'InitialMigration1784657840106';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "app_role" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "app_role"`);
  }
}
