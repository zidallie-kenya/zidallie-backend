import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1764750886953 implements MigrationInterface {
  name = 'InitialMigration1764750886953';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "account_balance_callbacks" ("id" SERIAL NOT NULL, "account_type" character varying(100) NOT NULL, "completed_time" TIMESTAMP, "raw_result" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_31a39f50bfb78a635c47e136e56" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ADD CONSTRAINT "FK_d590df596800ba48cb6e804c345" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ADD CONSTRAINT "FK_888cf43b225497d6cf10498c79f" FOREIGN KEY ("termId") REFERENCES "payment_terms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pending_payments" DROP CONSTRAINT "FK_888cf43b225497d6cf10498c79f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" DROP CONSTRAINT "FK_d590df596800ba48cb6e804c345"`,
    );
    await queryRunner.query(`DROP TABLE "account_balance_callbacks"`);
  }
}
