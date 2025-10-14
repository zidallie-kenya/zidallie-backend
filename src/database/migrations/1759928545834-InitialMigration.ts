import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1759928545834 implements MigrationInterface {
  name = 'InitialMigration1759928545834';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "school" ADD "terra_tag_id" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "school" DROP COLUMN "terra_tag_id"`);
  }
}
