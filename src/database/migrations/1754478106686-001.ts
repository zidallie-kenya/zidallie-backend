import { MigrationInterface, QueryRunner } from 'typeorm';

export class LocationEntity0011754478106686 implements MigrationInterface {
  name = 'LocationEntity0011754478106686';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "location_entity" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "driverId" character varying NOT NULL,
        "rideId" character varying NOT NULL,
        "latitude" numeric(10,6) NOT NULL,
        "longitude" numeric(10,6) NOT NULL,
        "timestamp" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_9debf81cdf142d284fce9b8fd7b" PRIMARY KEY ("id")
      )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "location_entity"`);
  }
}
