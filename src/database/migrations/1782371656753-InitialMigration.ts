import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1782371656753 implements MigrationInterface {
  name = 'InitialMigration1782371656753';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "onboarding" DROP CONSTRAINT "FK_c8afe559ad8a06471e3242beed8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "onboarding" ALTER COLUMN "student_name" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "onboarding" ALTER COLUMN "student_gender" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "onboarding" ALTER COLUMN "ride_type" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "onboarding" ALTER COLUMN "schoolId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "onboarding" ADD CONSTRAINT "FK_c8afe559ad8a06471e3242beed8" FOREIGN KEY ("schoolId") REFERENCES "school"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "onboarding" DROP CONSTRAINT "FK_c8afe559ad8a06471e3242beed8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "onboarding" ALTER COLUMN "schoolId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "onboarding" ALTER COLUMN "ride_type" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "onboarding" ALTER COLUMN "student_gender" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "onboarding" ALTER COLUMN "student_name" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "onboarding" ADD CONSTRAINT "FK_c8afe559ad8a06471e3242beed8" FOREIGN KEY ("schoolId") REFERENCES "school"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
