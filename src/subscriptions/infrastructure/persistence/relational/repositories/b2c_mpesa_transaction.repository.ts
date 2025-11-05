import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { B2cMpesaTransactionEntity } from '../entities/b2c_mpesa_transaction.entity';
import { CreateB2cMpesaTransactionDto } from '../../../../dto/create-b2c-mpesa-transaction.dto';

/**
 * Parse M-PESA B2C date strings like "19.12.2019 11:45:50" into valid JS Date objects.
 */
function parseMpesaDate(dateString: string): Date | null {
    if (!dateString) return null;

    // Expected format: "19.12.2019 11:45:50"
    const [day, month, rest] = dateString.split('.');
    if (!day || !month || !rest) return null;

    const [year, time] = rest.trim().split(' ');
    if (!year || !time) return null;

    const isoString = `${year}-${month}-${day}T${time}`;
    const parsed = new Date(isoString);

    return isNaN(parsed.getTime()) ? null : parsed;
}

@Injectable()
export class B2cMpesaTransactionRepository extends Repository<B2cMpesaTransactionEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(B2cMpesaTransactionEntity, dataSource.createEntityManager());
    }

    /**
     * Save a new B2C M-PESA transaction
     */
    async createTransaction(dto: CreateB2cMpesaTransactionDto) {
        const transaction = this.create({
            transactionId: dto.transaction_id,
            conversationId: dto.conversation_id,
            originatorConversationId: dto.originator_conversation_id,
            resultType: dto.result_type,
            resultCode: dto.result_code,
            resultDesc: dto.result_desc,
            transactionAmount: dto.transaction_amount,
            receiverPartyPublicName: dto.receiver_party_public_name,

            // ✅ Safely parse and handle date
            transactionCompletedAt: dto.transaction_completed_at
                ? parseMpesaDate(dto.transaction_completed_at)
                : null,

            rawResult: dto.raw_result,
        });

        return await this.save(transaction);
    }

    /**
     * Find a transaction by its M-PESA transaction ID
     */
    async findByTransactionId(transactionId: string) {
        return await this.findOne({ where: { transactionId } });
    }

    /**
     * Find transactions by conversation ID
     */
    async findByConversationId(conversationId: string) {
        return await this.find({
            where: { conversationId },
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Soft delete or remove transaction record
     */
    async removeTransaction(entity: B2cMpesaTransactionEntity) {
        return await this.remove(entity);
    }
}
