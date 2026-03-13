import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1773421190311 implements MigrationInterface {
  name = 'InitialMigration1773421190311';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "fuel_entity" ("id" SERIAL NOT NULL, "amount" numeric NOT NULL, "receipt_url" character varying NOT NULL, "fuel_date" TIMESTAMP NOT NULL DEFAULT now(), "vehicleId" integer, CONSTRAINT "PK_46d8bc9fe1fda43168350d10294" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "maintenance_entity" ("id" SERIAL NOT NULL, "mileage" integer NOT NULL, "cost" numeric NOT NULL, "receipt_url" character varying NOT NULL, "maintenance_date" TIMESTAMP NOT NULL DEFAULT now(), "vehicleId" integer, CONSTRAINT "PK_e9a796a8ab5a0cb2402d89158f8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_ride" ADD "embark_latitude" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_ride" ADD "embark_longitude" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_ride" ADD "disembark_latitude" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_ride" ADD "disembark_longitude" double precision`,
    );
    await queryRunner.query(`ALTER TABLE "daily_ride" ADD "route_data" jsonb`);
    await queryRunner.query(`ALTER TABLE "vehicle" ADD "minders_name" text`);
    await queryRunner.query(`ALTER TABLE "vehicle" ADD "minders_id_url" text`);
    await queryRunner.query(
      `ALTER TABLE "fuel_entity" ADD CONSTRAINT "FK_28e1549c69a627b6f8eca5b637f" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_entity" ADD CONSTRAINT "FK_38a8149ee6bd62fe4a34650e8c5" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "maintenance_entity" DROP CONSTRAINT "FK_38a8149ee6bd62fe4a34650e8c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fuel_entity" DROP CONSTRAINT "FK_28e1549c69a627b6f8eca5b637f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle" DROP COLUMN "minders_id_url"`,
    );
    await queryRunner.query(`ALTER TABLE "vehicle" DROP COLUMN "minders_name"`);
    await queryRunner.query(
      `ALTER TABLE "daily_ride" DROP COLUMN "route_data"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_ride" DROP COLUMN "disembark_longitude"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_ride" DROP COLUMN "disembark_latitude"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_ride" DROP COLUMN "embark_longitude"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_ride" DROP COLUMN "embark_latitude"`,
    );
    await queryRunner.query(`DROP TABLE "maintenance_entity"`);
    await queryRunner.query(`DROP TABLE "fuel_entity"`);
  }
}
