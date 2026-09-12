import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1789208366467 implements MigrationInterface {
  name = 'InitialMigration1789208366467';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_location_daily_ride_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_daily_ride_rideid"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_daily_ride_driver_status_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking_child" ADD "student_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking_child" ADD CONSTRAINT "FK_2b1f4c210e0088a6a259057954d" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transport_booking_child" DROP CONSTRAINT "FK_2b1f4c210e0088a6a259057954d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking_child" DROP COLUMN "student_id"`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_daily_ride_driver_status_date" ON "daily_ride" ("date", "driverId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_daily_ride_rideid" ON "daily_ride" ("rideId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_location_daily_ride_id" ON "location" ("dailyRideId") `,
    );
  }
}
