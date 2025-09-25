import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1758791338951 implements MigrationInterface {
  name = 'InitialMigration1758791338951';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "school" ADD "smart_card_url" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "school" DROP COLUMN "smart_card_url"`,
    );
  }
}
