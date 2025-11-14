import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1763132045871 implements MigrationInterface {
  name = 'InitialMigration1763132045871';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscription_student"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscription_plan"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" DROP CONSTRAINT "FK_plan_school"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" DROP CONSTRAINT "FK_d590df596800ba48cb6e804c345"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" DROP CONSTRAINT "FK_684c9d531e18324607e7ad27e66"`,
    );
    await queryRunner.query(
      `CREATE TABLE "term_commissions" ("id" SERIAL NOT NULL, "commission_amount" double precision NOT NULL, "is_paid" boolean NOT NULL DEFAULT false, "paid_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "studentId" integer NOT NULL, "termId" integer NOT NULL, CONSTRAINT "PK_67898c6c8270c42da59eb50623e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ec150cda46164137ab54598bbc" ON "term_commissions" ("studentId", "termId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "school_disbursements" ("id" SERIAL NOT NULL, "bank_paybill" text, "account_number" text, "amount_disbursed" double precision NOT NULL, "disbursement_type" character varying(10) NOT NULL, "transaction_id" text, "status" character varying(20) NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "studentId" integer NOT NULL, "termId" integer, "paymentId" integer NOT NULL, CONSTRAINT "PK_4c939bcd9904405eb2265aca6bb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "student_payments" ("id" SERIAL NOT NULL, "transaction_id" text NOT NULL, "phone_number" text NOT NULL, "amount_paid" double precision NOT NULL, "payment_type" character varying(20) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "studentId" integer NOT NULL, "termId" integer, CONSTRAINT "PK_e7505845c50977798312c4af0aa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_terms" ("id" SERIAL NOT NULL, "name" text NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "schoolId" integer, CONSTRAINT "PK_a7e7ab8cabd8982c57d817b7164" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "total_paid" double precision NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "balance" double precision NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "is_commission_paid" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "days_access" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "last_payment_date" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "term_id" integer`,
    );
    await queryRunner.query(`ALTER TABLE "school" ADD "terra_zone_tag" text`);
    await queryRunner.query(
      `ALTER TABLE "school" ADD "terra_parents_tag" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "school" ADD "terra_student_tag" text`,
    );
    await queryRunner.query(`ALTER TABLE "school" ADD "terra_school_tag" text`);
    await queryRunner.query(
      `ALTER TABLE "school" ADD "has_commission" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "school" ADD "commission_amount" double precision`,
    );
    await queryRunner.query(`ALTER TABLE "school" ADD "paybill" text`);
    await queryRunner.query(
      `ALTER TABLE "school" ADD "service_type" character varying(10)`,
    );
    await queryRunner.query(`ALTER TABLE "student" ADD "account_number" text`);
    await queryRunner.query(
      `ALTER TABLE "student" ADD "daily_fee" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" ADD "transport_term_fee" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "student" ADD "service_type" character varying(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ADD "termId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ADD "phoneNumber" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ADD "paymentType" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ADD "paymentModel" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ADD "schoolId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "status" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "student_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "plan_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ALTER COLUMN "commission_amount" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ALTER COLUMN "is_active" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "school" DROP COLUMN "disbursement_phone_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school" ADD "disbursement_phone_number" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "school" DROP COLUMN "bank_paybill_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school" ADD "bank_paybill_number" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "school" DROP COLUMN "bank_account_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school" ADD "bank_account_number" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ALTER COLUMN "studentId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ALTER COLUMN "subscriptionPlanId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" DROP COLUMN "checkoutId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ADD "checkoutId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ADD CONSTRAINT "UQ_8dd4d145218281831704c63b53f" UNIQUE ("checkoutId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "b2cmpesa_transactions"."raw_result" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "b2cmpesa_transactions" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "b2cmpesa_transactions" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "term_commissions" ADD CONSTRAINT "FK_74e9ded5341c360e559cd4b50d8" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "term_commissions" ADD CONSTRAINT "FK_135ecf7e9582ebc7ff915598ce5" FOREIGN KEY ("termId") REFERENCES "payment_terms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_disbursements" ADD CONSTRAINT "FK_26edec3913107f32f00f3412df8" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_disbursements" ADD CONSTRAINT "FK_590c32322a4590f44685c52109c" FOREIGN KEY ("termId") REFERENCES "payment_terms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_disbursements" ADD CONSTRAINT "FK_829223965821ce99f42765f6ab0" FOREIGN KEY ("paymentId") REFERENCES "student_payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_payments" ADD CONSTRAINT "FK_0fbb8d567ed32afcb7b12f9f919" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_payments" ADD CONSTRAINT "FK_b52db304c2e5eab09a55e42598d" FOREIGN KEY ("termId") REFERENCES "payment_terms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_terms" ADD CONSTRAINT "FK_c7497de1f59c9d6d499b61983b7" FOREIGN KEY ("schoolId") REFERENCES "school"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_d95f5faf8cd9c4c016f40779638" FOREIGN KEY ("term_id") REFERENCES "payment_terms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_dee89f47ca621f441b655c282b4" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ADD CONSTRAINT "FK_cfa9aadb42e5e98a9f95b3869ce" FOREIGN KEY ("school_id") REFERENCES "school"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" DROP CONSTRAINT "FK_cfa9aadb42e5e98a9f95b3869ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_dee89f47ca621f441b655c282b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_d95f5faf8cd9c4c016f40779638"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_terms" DROP CONSTRAINT "FK_c7497de1f59c9d6d499b61983b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_payments" DROP CONSTRAINT "FK_b52db304c2e5eab09a55e42598d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_payments" DROP CONSTRAINT "FK_0fbb8d567ed32afcb7b12f9f919"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_disbursements" DROP CONSTRAINT "FK_829223965821ce99f42765f6ab0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_disbursements" DROP CONSTRAINT "FK_590c32322a4590f44685c52109c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school_disbursements" DROP CONSTRAINT "FK_26edec3913107f32f00f3412df8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "term_commissions" DROP CONSTRAINT "FK_135ecf7e9582ebc7ff915598ce5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "term_commissions" DROP CONSTRAINT "FK_74e9ded5341c360e559cd4b50d8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "b2cmpesa_transactions" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "b2cmpesa_transactions" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "b2cmpesa_transactions"."raw_result" IS 'Stores the full raw callback payload for audit purposes'`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" DROP CONSTRAINT "UQ_8dd4d145218281831704c63b53f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" DROP COLUMN "checkoutId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ADD "checkoutId" character varying(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ALTER COLUMN "subscriptionPlanId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ALTER COLUMN "studentId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "school" DROP COLUMN "bank_account_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school" ADD "bank_account_number" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "school" DROP COLUMN "bank_paybill_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school" ADD "bank_paybill_number" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "school" DROP COLUMN "disbursement_phone_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school" ADD "disbursement_phone_number" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ALTER COLUMN "is_active" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ALTER COLUMN "commission_amount" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "plan_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "student_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "status" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" DROP COLUMN "schoolId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" DROP COLUMN "paymentModel"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" DROP COLUMN "paymentType"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" DROP COLUMN "phoneNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" DROP COLUMN "termId"`,
    );
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "service_type"`);
    await queryRunner.query(
      `ALTER TABLE "student" DROP COLUMN "transport_term_fee"`,
    );
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "daily_fee"`);
    await queryRunner.query(
      `ALTER TABLE "student" DROP COLUMN "account_number"`,
    );
    await queryRunner.query(`ALTER TABLE "school" DROP COLUMN "service_type"`);
    await queryRunner.query(`ALTER TABLE "school" DROP COLUMN "paybill"`);
    await queryRunner.query(
      `ALTER TABLE "school" DROP COLUMN "commission_amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school" DROP COLUMN "has_commission"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school" DROP COLUMN "terra_school_tag"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school" DROP COLUMN "terra_student_tag"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school" DROP COLUMN "terra_parents_tag"`,
    );
    await queryRunner.query(
      `ALTER TABLE "school" DROP COLUMN "terra_zone_tag"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "term_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "last_payment_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "days_access"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "is_commission_paid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "balance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "total_paid"`,
    );
    await queryRunner.query(`DROP TABLE "payment_terms"`);
    await queryRunner.query(`DROP TABLE "student_payments"`);
    await queryRunner.query(`DROP TABLE "school_disbursements"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ec150cda46164137ab54598bbc"`,
    );
    await queryRunner.query(`DROP TABLE "term_commissions"`);
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ADD CONSTRAINT "FK_684c9d531e18324607e7ad27e66" FOREIGN KEY ("subscriptionPlanId") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pending_payments" ADD CONSTRAINT "FK_d590df596800ba48cb6e804c345" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ADD CONSTRAINT "FK_plan_school" FOREIGN KEY ("school_id") REFERENCES "school"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscription_plan" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscription_student" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }
}
