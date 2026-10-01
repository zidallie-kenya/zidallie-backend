import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1789600322218 implements MigrationInterface {
  name = 'InitialMigration1789600322218';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "route_stop" ("id" SERIAL NOT NULL, "sequence_order" integer NOT NULL, "kind" character varying(10) NOT NULL, "latitude" numeric(15,8) NOT NULL, "longitude" numeric(15,8) NOT NULL, "address_label" text, "time_window_start" TIME NOT NULL, "time_window_end" TIME NOT NULL, "estimated_arrival" TIMESTAMP WITH TIME ZONE, "actual_arrival" TIMESTAMP WITH TIME ZONE, "status" character varying(10) NOT NULL DEFAULT 'pending', "distance_from_previous_m" integer, "duration_from_previous_s" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "route_id" integer, "student_id" integer, "booking_child_id" integer, "pickup_station_id" integer, CONSTRAINT "PK_bae45354739f262bfdc6f830f70" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f5620141380a35915242ae067f" ON "route_stop" ("route_id", "sequence_order") `,
    );
    await queryRunner.query(
      `CREATE TABLE "route" ("id" SERIAL NOT NULL, "term" character varying(20) NOT NULL, "service_type" character varying(10) NOT NULL, "kind" character varying(10) NOT NULL, "trip_date" date NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'draft', "total_distance_km" numeric(6,2), "total_duration_minutes" integer, "route_start_time" TIME, "route_end_time" TIME, "trip_amount" numeric(10,2), "origin_latitude" numeric(15,8), "origin_longitude" numeric(15,8), "meta" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "driver_id" integer, "vehicle_id" integer, "carpool_school_id" integer, "bus_school_id" integer, CONSTRAINT "PK_08affcd076e46415e5821acf52d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_efa64a74650de27454b79c9394" ON "route" ("term") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_900612370b6703405ebbc2e476" ON "route" ("trip_date") `,
    );
    await queryRunner.query(
      `ALTER TABLE "route_stop" ADD CONSTRAINT "FK_9abda76d5174189dc14fcd22244" FOREIGN KEY ("route_id") REFERENCES "route"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_stop" ADD CONSTRAINT "FK_7d7ba027971a183be1110223676" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_stop" ADD CONSTRAINT "FK_a7ee3c6191557d631b6450077dd" FOREIGN KEY ("booking_child_id") REFERENCES "transport_booking_child"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_stop" ADD CONSTRAINT "FK_4950d45cb67afbd991c484df564" FOREIGN KEY ("pickup_station_id") REFERENCES "pickup_station"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "route" ADD CONSTRAINT "FK_c1310391be01ff2e8a4ca461325" FOREIGN KEY ("driver_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "route" ADD CONSTRAINT "FK_3d44318393c5e24882bd5bf433b" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "route" ADD CONSTRAINT "FK_7374d4a47fa711107dedef3fc48" FOREIGN KEY ("carpool_school_id") REFERENCES "carpool_school"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "route" ADD CONSTRAINT "FK_2e8b41f4de25a564374e6675f88" FOREIGN KEY ("bus_school_id") REFERENCES "bus_school"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "route" DROP CONSTRAINT "FK_2e8b41f4de25a564374e6675f88"`,
    );
    await queryRunner.query(
      `ALTER TABLE "route" DROP CONSTRAINT "FK_7374d4a47fa711107dedef3fc48"`,
    );
    await queryRunner.query(
      `ALTER TABLE "route" DROP CONSTRAINT "FK_3d44318393c5e24882bd5bf433b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "route" DROP CONSTRAINT "FK_c1310391be01ff2e8a4ca461325"`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_stop" DROP CONSTRAINT "FK_4950d45cb67afbd991c484df564"`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_stop" DROP CONSTRAINT "FK_a7ee3c6191557d631b6450077dd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_stop" DROP CONSTRAINT "FK_7d7ba027971a183be1110223676"`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_stop" DROP CONSTRAINT "FK_9abda76d5174189dc14fcd22244"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_900612370b6703405ebbc2e476"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_efa64a74650de27454b79c9394"`,
    );
    await queryRunner.query(`DROP TABLE "route"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f5620141380a35915242ae067f"`,
    );
    await queryRunner.query(`DROP TABLE "route_stop"`);
  }
}
