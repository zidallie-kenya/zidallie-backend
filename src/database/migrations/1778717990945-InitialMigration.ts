import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1778717990945 implements MigrationInterface {
  name = 'InitialMigration1778717990945';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_daily_ride_date"`);
    await queryRunner.query(`DROP INDEX "public"."idx_daily_ride_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_daily_ride_rideid"`);
    await queryRunner.query(
      `ALTER TABLE "fuel_entity" ADD "fuel_pump_url" text`,
    );
    await queryRunner.query(`ALTER TABLE "fuel_entity" ADD "notes" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "fuel_entity" DROP COLUMN "notes"`);
    await queryRunner.query(
      `ALTER TABLE "fuel_entity" DROP COLUMN "fuel_pump_url"`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_daily_ride_rideid" ON "daily_ride" ("rideId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_daily_ride_status" ON "daily_ride" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_daily_ride_date" ON "daily_ride" ("date") `,
    );
  }
}
