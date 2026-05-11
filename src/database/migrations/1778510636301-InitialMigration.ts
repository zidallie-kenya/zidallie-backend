import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1778510636301 implements MigrationInterface {
  name = 'InitialMigration1778510636301';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_location_dailyrideid"`);
    await queryRunner.query(`DROP INDEX "public"."idx_location_driverid"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_daily_ride_driver_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_subscriptions_student_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_pending_payments_checkoutid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_ride" ADD "had_active_subscription" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_ride" ADD "snapshot_subscription_id" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "daily_ride" DROP COLUMN "snapshot_subscription_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_ride" DROP COLUMN "had_active_subscription"`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_pending_payments_checkoutid" ON "pending_payments" ("checkoutId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_subscriptions_student_id" ON "subscriptions" ("student_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_daily_ride_driver_status" ON "daily_ride" ("driverId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_location_driverid" ON "location" ("driverId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_location_dailyrideid" ON "location" ("dailyRideId") `,
    );
  }
}
