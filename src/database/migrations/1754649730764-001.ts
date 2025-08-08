import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateKyc0011754649730764 implements MigrationInterface {
  name = '0011754649730764';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "kyc" ("id" SERIAL NOT NULL, "national_id_front" character varying NOT NULL, "national_id_back" character varying NOT NULL, "passport_photo" character varying NOT NULL, "driving_license" character varying NOT NULL, "certificate_of_good_conduct" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "comments" character varying NOT NULL, "is_verified" boolean NOT NULL DEFAULT false, "userId" integer, CONSTRAINT "REL_ca948073ed4a3ba22030d37b3d" UNIQUE ("userId"), CONSTRAINT "PK_84ab2e81ea9700d29dda719f3be" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "kyc" ADD CONSTRAINT "FK_ca948073ed4a3ba22030d37b3db" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "kyc" DROP CONSTRAINT "FK_ca948073ed4a3ba22030d37b3db"`,
    );
    await queryRunner.query(`DROP TABLE "kyc"`);
  }
}
