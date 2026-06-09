import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1781007705369 implements MigrationInterface {
  name = 'InitialMigration1781007705369';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "booking_receipt" ("id" SERIAL NOT NULL, "reference" character varying(20) NOT NULL, "name" character varying(50) NOT NULL, "term" character varying(20) NOT NULL, "amount" numeric(10,2) NOT NULL, "balance_remaining" numeric(10,2), "payment_type" character varying(20) NOT NULL, "service_type" character varying(10) NOT NULL, "school_name" character varying(200), "home_location" character varying(200), "children_count" integer, "payment_method" character varying(20) NOT NULL DEFAULT 'M-Pesa', "mpesa_transaction_id" character varying(50), "paid_at" TIMESTAMP NOT NULL DEFAULT now(), "parent_id" integer NOT NULL, "booking_id" integer NOT NULL, CONSTRAINT "UQ_026b772bd2c26c73f59512258cf" UNIQUE ("reference"), CONSTRAINT "PK_0466ac9be5a526bae77b66ef436" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" ADD "rfid_code" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_receipt" ADD CONSTRAINT "FK_507b22965d97bb648456ec74bc9" FOREIGN KEY ("parent_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_receipt" ADD CONSTRAINT "FK_f07fc5d98dd742f70383a23151c" FOREIGN KEY ("booking_id") REFERENCES "transport_booking"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "booking_receipt" DROP CONSTRAINT "FK_f07fc5d98dd742f70383a23151c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_receipt" DROP CONSTRAINT "FK_507b22965d97bb648456ec74bc9"`,
    );
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "rfid_code"`);
    await queryRunner.query(`DROP TABLE "booking_receipt"`);
  }
}
