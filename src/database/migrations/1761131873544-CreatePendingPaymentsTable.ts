import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreatePendingPaymentsTable1678901234567 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'pending_payments',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'studentId',
                        type: 'int',
                        isNullable: false,
                    },
                    {
                        name: 'amount',
                        type: 'float',
                        isNullable: false,
                    },
                    {
                        name: 'checkoutId',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
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

        // Add foreign key to student table
        await queryRunner.createForeignKey(
            'pending_payments',
            new TableForeignKey({
                columnNames: ['studentId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'student',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('pending_payments');
        // Drop foreign key for student_id
        const studentForeignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf('studentId') !== -1);
        if (studentForeignKey) {
            await queryRunner.dropForeignKey('pending_payments', studentForeignKey);
        }

        await queryRunner.dropTable('pending_payments');
    }
}
