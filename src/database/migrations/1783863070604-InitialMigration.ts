import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1783863070604 implements MigrationInterface {
  name = 'InitialMigration1783863070604';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "kyc" ADD "kra_pin_vertificate" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc" ADD "kra_pin" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc" ADD "national_id_number" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc" ADD "driving_license_number" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc" ADD "driving_license_expiry_date" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc" ADD "certificate_of_good_conduct_issue_date" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle" ADD "vehicle_image_url_front" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle" ADD "vehicle_image_url_back" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle" ADD "vehicle_image_url_inside" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle" ADD "insurance_certificate_expiry" date`,
    );
    await queryRunner.query(`ALTER TABLE "vehicle" ADD "logbook" text`);
    await queryRunner.query(
      `ALTER TABLE "vehicle" ADD "vehicle_inspection_report" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle" ADD "vehicle_inspection_expiry" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_entity" ADD "notes" text`,
    );
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "service_type"`);
    await queryRunner.query(
      `ALTER TABLE "student" ADD "service_type" character varying(10)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "student" DROP COLUMN "service_type"`);
    await queryRunner.query(
      `ALTER TABLE "student" ADD "service_type" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_entity" DROP COLUMN "notes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle" DROP COLUMN "vehicle_inspection_expiry"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle" DROP COLUMN "vehicle_inspection_report"`,
    );
    await queryRunner.query(`ALTER TABLE "vehicle" DROP COLUMN "logbook"`);
    await queryRunner.query(
      `ALTER TABLE "vehicle" DROP COLUMN "insurance_certificate_expiry"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle" DROP COLUMN "vehicle_image_url_inside"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle" DROP COLUMN "vehicle_image_url_back"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle" DROP COLUMN "vehicle_image_url_front"`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc" DROP COLUMN "certificate_of_good_conduct_issue_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc" DROP COLUMN "driving_license_expiry_date"`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc" DROP COLUMN "driving_license_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc" DROP COLUMN "national_id_number"`,
    );
    await queryRunner.query(`ALTER TABLE "kyc" DROP COLUMN "kra_pin"`);
    await queryRunner.query(
      `ALTER TABLE "kyc" DROP COLUMN "kra_pin_vertificate"`,
    );
  }
}
