import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1756323204816 implements MigrationInterface {
  name = 'InitialMigration1756323204816';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_75e2be4ce11d447ef43be0e374f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "photoId" TO "photo"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "photo"`);
    await queryRunner.query(`ALTER TABLE "user" ADD "photo" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "photo"`);
    await queryRunner.query(`ALTER TABLE "user" ADD "photo" uuid`);
    await queryRunner.query(
      `ALTER TABLE "user" RENAME COLUMN "photo" TO "photoId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_75e2be4ce11d447ef43be0e374f" FOREIGN KEY ("photoId") REFERENCES "file"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
