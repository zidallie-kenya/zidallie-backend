import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1779388793935 implements MigrationInterface {
  name = 'InitialMigration1779388793935';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "vehicle_report" ("id" SERIAL NOT NULL, "report_url" text NOT NULL, "file_name" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "vehicleId" integer NOT NULL, CONSTRAINT "PK_830d91645dcd3505fb4a8a6bf06" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle" DROP COLUMN "vehicle_report_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_report" ADD CONSTRAINT "FK_242cafa70c4b0e40f7e5cc2a481" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicle_report" DROP CONSTRAINT "FK_242cafa70c4b0e40f7e5cc2a481"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle" ADD "vehicle_report_url" text`,
    );
    await queryRunner.query(`DROP TABLE "vehicle_report"`);
  }
}
