import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1780854458347 implements MigrationInterface {
  name = 'InitialMigration1780854458347';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_daily_ride_driver_status"`,
    );
    await queryRunner.query(
      `CREATE TABLE "pickup_station" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "region" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_439e48ede58ae2cf97f1d329dba" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "transport_pricing" ("id" SERIAL NOT NULL, "region" character varying(100) NOT NULL, "service_type" character varying(10) NOT NULL, "distance_range" character varying(20) NOT NULL, "max_km" integer NOT NULL, "price" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2ca7a77ed0aa94126becaad028d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "carpool_school" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "region" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6560c793a3d103d98f27b60a7a1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "bus_school" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "region" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_47fd5bcc465d3feb4a3a89dbc5f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "transport_booking_deposit" ("id" SERIAL NOT NULL, "amount" numeric(10,2) NOT NULL, "phone_number" character varying(20) NOT NULL, "checkout_request_id" character varying(100), "status" character varying(20) NOT NULL DEFAULT 'pending', "mpesa_transaction_id" character varying(100), "payment_type" character varying(20) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "booking_id" integer, "parent_id" integer NOT NULL, CONSTRAINT "UQ_c2c31c9dd2aa7999e830965b979" UNIQUE ("checkout_request_id"), CONSTRAINT "PK_cec6054ed94eaa0036c66cc2f85" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transport_booking_child_emergency_contact_enum" AS ENUM('class_teacher', 'transport_manager', 'director', 'school_secretary')`,
    );
    await queryRunner.query(
      `CREATE TABLE "transport_booking_child" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "grade_class" character varying(50), "pickup_time" TIME, "dropoff_time" TIME, "emergency_contact" "public"."transport_booking_child_emergency_contact_enum" NOT NULL DEFAULT 'class_teacher', "emergency_contact_phone" character varying(20) NOT NULL, "emergency_contact_email" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "booking_id" integer, CONSTRAINT "PK_60815b2803a0f9d7d6eb08cbbb6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "transport_booking" ("id" SERIAL NOT NULL, "service_type" character varying(10) NOT NULL, "term" character varying(20) NOT NULL, "trip_type" character varying(10) NOT NULL DEFAULT 'two_way', "children_count" integer NOT NULL DEFAULT '1', "home_area" character varying(200), "home_lat" numeric(15,8), "home_lon" numeric(15,8), "region" character varying(100), "distance_km" numeric(6,2), "price_per_child" numeric(10,2), "total_price" numeric(10,2), "deposit_amount" numeric(10,2), "balance_amount" numeric(10,2), "is_waitlisted" boolean NOT NULL DEFAULT true, "status" character varying(20) NOT NULL DEFAULT 'pending', "total_paid" numeric(10,2) NOT NULL DEFAULT '0', "waitlist_started_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "parent_id" integer NOT NULL, "carpool_school_id" integer, "bus_school_id" integer, "pickup_station_id" integer, "cluster_id" integer, CONSTRAINT "PK_076c33b87c87ddd50d677c57c18" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "transport_cluster" ("id" SERIAL NOT NULL, "name" character varying(100), "zone" character varying(100) NOT NULL DEFAULT 'General', "max_capacity" integer NOT NULL DEFAULT '7', "is_active" boolean NOT NULL DEFAULT false, "term" character varying(20), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1fb2b5ce142cb733ca1c8707362" UNIQUE ("name"), CONSTRAINT "PK_54f01d75a6a4f9c71ef31496925" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking_deposit" ADD CONSTRAINT "FK_a3735a281c71f6ad005fb43a06b" FOREIGN KEY ("booking_id") REFERENCES "transport_booking"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking_deposit" ADD CONSTRAINT "FK_9b813e178cc35b889b5adc8d26c" FOREIGN KEY ("parent_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking_child" ADD CONSTRAINT "FK_6c12fe42d4ba7c4c8abc2689131" FOREIGN KEY ("booking_id") REFERENCES "transport_booking"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking" ADD CONSTRAINT "FK_c7ecf24b90b2ae05e8e8b43616e" FOREIGN KEY ("parent_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking" ADD CONSTRAINT "FK_b4aa70c18363dea4ec82ca819c1" FOREIGN KEY ("carpool_school_id") REFERENCES "carpool_school"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking" ADD CONSTRAINT "FK_7eaccdee36ebef5a01a25561a04" FOREIGN KEY ("bus_school_id") REFERENCES "bus_school"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking" ADD CONSTRAINT "FK_d85fb8f3e92d6db010ee4faeeb2" FOREIGN KEY ("pickup_station_id") REFERENCES "pickup_station"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking" ADD CONSTRAINT "FK_73876c09260379564c89ee83566" FOREIGN KEY ("cluster_id") REFERENCES "transport_cluster"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transport_booking" DROP CONSTRAINT "FK_73876c09260379564c89ee83566"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking" DROP CONSTRAINT "FK_d85fb8f3e92d6db010ee4faeeb2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking" DROP CONSTRAINT "FK_7eaccdee36ebef5a01a25561a04"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking" DROP CONSTRAINT "FK_b4aa70c18363dea4ec82ca819c1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking" DROP CONSTRAINT "FK_c7ecf24b90b2ae05e8e8b43616e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking_child" DROP CONSTRAINT "FK_6c12fe42d4ba7c4c8abc2689131"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking_deposit" DROP CONSTRAINT "FK_9b813e178cc35b889b5adc8d26c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transport_booking_deposit" DROP CONSTRAINT "FK_a3735a281c71f6ad005fb43a06b"`,
    );
    await queryRunner.query(`DROP TABLE "transport_cluster"`);
    await queryRunner.query(`DROP TABLE "transport_booking"`);
    await queryRunner.query(`DROP TABLE "transport_booking_child"`);
    await queryRunner.query(
      `DROP TYPE "public"."transport_booking_child_emergency_contact_enum"`,
    );
    await queryRunner.query(`DROP TABLE "transport_booking_deposit"`);
    await queryRunner.query(`DROP TABLE "bus_school"`);
    await queryRunner.query(`DROP TABLE "carpool_school"`);
    await queryRunner.query(`DROP TABLE "transport_pricing"`);
    await queryRunner.query(`DROP TABLE "pickup_station"`);
    await queryRunner.query(
      `CREATE INDEX "idx_daily_ride_driver_status" ON "daily_ride" ("driverId", "status") `,
    );
  }
}
