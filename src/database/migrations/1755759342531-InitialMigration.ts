import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1755759342531 implements MigrationInterface {
  name = 'InitialMigration1755759342531';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notification" ADD "sender" text`);
    await queryRunner.query(`ALTER TABLE "notification" ADD "receiver" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification" DROP COLUMN "receiver"`,
    );
    await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "sender"`);
  }
}
