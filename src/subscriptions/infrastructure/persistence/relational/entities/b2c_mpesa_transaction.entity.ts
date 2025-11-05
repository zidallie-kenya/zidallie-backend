import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('b2cmpesa_transactions')
export class B2cMpesaTransactionEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'transaction_id', nullable: true })
    transactionId: string;

    @Column({ name: 'conversation_id', nullable: true })
    conversationId: string;

    @Column({ name: 'originator_conversation_id', nullable: true })
    originatorConversationId: string;

    @Column({ name: 'result_type', type: 'int', nullable: true })
    resultType: number;

    @Column({ name: 'result_code', type: 'int', nullable: true })
    resultCode: number;

    @Column({ name: 'result_desc', type: 'varchar', length: 255, nullable: true })
    resultDesc: string;

    @Column({
        name: 'transaction_amount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    transactionAmount: number;

    @Column({
        name: 'receiver_party_public_name',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    receiverPartyPublicName: string;

    @Column({ name: 'transaction_completed_at', type: 'timestamp', nullable: true })
    transactionCompletedAt: Date | null;

    @Column({ name: 'raw_result', type: 'jsonb', nullable: true })
    rawResult: Record<string, any>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
