import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1755629291138 implements MigrationInterface {
  name = 'InitialMigration1755629291138';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification" ADD "senderId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" ADD CONSTRAINT "FK_c0af34102c13c654955a0c5078b" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification" DROP CONSTRAINT "FK_c0af34102c13c654955a0c5078b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification" DROP COLUMN "senderId"`,
    );
  }
}
