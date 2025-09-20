import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1757317894589 implements MigrationInterface {
  name = 'InitialMigration1757317894589';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "school_id" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "school_id"`);
  }
}
