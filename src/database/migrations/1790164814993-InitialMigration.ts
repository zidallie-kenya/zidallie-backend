import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1790164814993 implements MigrationInterface {
  name = 'InitialMigration1790164814993';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."route_offer_status_enum" AS ENUM('pending', 'accepted', 'no_driver_found', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "route_offer" ("id" SERIAL NOT NULL, "route_id" integer NOT NULL, "candidates" jsonb NOT NULL, "current_batch_start_index" integer NOT NULL DEFAULT '0', "current_batch_pushed_at" TIMESTAMP WITH TIME ZONE, "cascade_started_at" TIMESTAMP WITH TIME ZONE NOT NULL, "cascade_deadline_at" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."route_offer_status_enum" NOT NULL DEFAULT 'pending', "accepted_driver_id" integer, "accepted_vehicle_id" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_63df7db80c60a2c3e59fd9b9d6" UNIQUE ("route_id"), CONSTRAINT "PK_b81192432bf46510965e6bd2752" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."route_offer_attempt_response_enum" AS ENUM('pending', 'accepted', 'declined', 'superseded', 'infeasible_on_accept')`,
    );
    await queryRunner.query(
      `CREATE TABLE "route_offer_attempt" ("id" SERIAL NOT NULL, "route_offer_id" integer NOT NULL, "driver_id" integer NOT NULL, "vehicle_id" integer NOT NULL, "pushed_at" TIMESTAMP WITH TIME ZONE NOT NULL, "responded_at" TIMESTAMP WITH TIME ZONE, "response" "public"."route_offer_attempt_response_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2908f45ca4a16e5e4a48efc3960" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_offer" ADD CONSTRAINT "FK_63df7db80c60a2c3e59fd9b9d6d" FOREIGN KEY ("route_id") REFERENCES "route"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_offer_attempt" ADD CONSTRAINT "FK_8c3df3cb17159062fa99986a557" FOREIGN KEY ("route_offer_id") REFERENCES "route_offer"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "route_offer_attempt" DROP CONSTRAINT "FK_8c3df3cb17159062fa99986a557"`,
    );
    await queryRunner.query(
      `ALTER TABLE "route_offer" DROP CONSTRAINT "FK_63df7db80c60a2c3e59fd9b9d6d"`,
    );
    await queryRunner.query(`DROP TABLE "route_offer_attempt"`);
    await queryRunner.query(
      `DROP TYPE "public"."route_offer_attempt_response_enum"`,
    );
    await queryRunner.query(`DROP TABLE "route_offer"`);
    await queryRunner.query(`DROP TYPE "public"."route_offer_status_enum"`);
  }
}
