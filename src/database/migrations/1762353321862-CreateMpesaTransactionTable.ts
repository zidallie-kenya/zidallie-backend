import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateMpesaTransactionTable1730829000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'b2cmpesa_transactions',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'transaction_id',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'conversation_id',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'originator_conversation_id',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'result_type',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'result_code',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'result_desc',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'transaction_amount',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'receiver_party_public_name',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'transaction_completed_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'raw_result',
                        type: 'jsonb',
                        isNullable: true,
                        comment: 'Stores the full raw callback payload for audit purposes',
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('b2cmpesa_transactions');
    }
}
