import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1759062043711 implements MigrationInterface {
  name = 'InitialMigration1759062043711';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "school" ADD "terra_email" text`);
    await queryRunner.query(`ALTER TABLE "school" ADD "terra_password" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "school" DROP COLUMN "terra_password"`,
    );
    await queryRunner.query(`ALTER TABLE "school" DROP COLUMN "terra_email"`);
  }
}
