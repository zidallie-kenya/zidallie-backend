import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionsTable1754920123456 implements MigrationInterface {
  name = 'AddSubscriptionsTable1754920123456';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" SERIAL PRIMARY KEY,
        "start_date" DATE NOT NULL,
        "expiry_date" DATE NOT NULL,
        "student_id" INTEGER NOT NULL,
        "plan_id" INTEGER NOT NULL,
        "amount" DOUBLE PRECISION,
        "status" VARCHAR(20) DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_subscription_student"
          FOREIGN KEY ("student_id") REFERENCES "student"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_subscription_plan"
          FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id")
          ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "subscriptions"`);
  }
}
