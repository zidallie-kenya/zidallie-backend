import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1755802077298 implements MigrationInterface {
  name = 'InitialMigration1755802077298';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "push_token" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "push_token"`);
  }
}
