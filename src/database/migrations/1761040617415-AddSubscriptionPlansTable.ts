import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionPlansTable1754921023456
  implements MigrationInterface
{
  name = 'AddSubscriptionPlansTable1754920023456';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "subscription_plans" (
        "id" SERIAL PRIMARY KEY,
        "school_id" INTEGER NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "description" TEXT,
        "duration_days" INTEGER NOT NULL, -- number of days this plan lasts
        "price" DOUBLE PRECISION NOT NULL,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_plan_school"
          FOREIGN KEY ("school_id") REFERENCES "school"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "subscription_plans"`);
  }
}
