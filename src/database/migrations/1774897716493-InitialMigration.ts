import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1774897716493 implements MigrationInterface {
  name = 'InitialMigration1774897716493';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "FK_b8714a308f2902a4952eed3f55f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ALTER COLUMN "dailyRideId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "FK_b8714a308f2902a4952eed3f55f" FOREIGN KEY ("dailyRideId") REFERENCES "daily_ride"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "location" DROP CONSTRAINT "FK_b8714a308f2902a4952eed3f55f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ALTER COLUMN "dailyRideId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD CONSTRAINT "FK_b8714a308f2902a4952eed3f55f" FOREIGN KEY ("dailyRideId") REFERENCES "daily_ride"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
