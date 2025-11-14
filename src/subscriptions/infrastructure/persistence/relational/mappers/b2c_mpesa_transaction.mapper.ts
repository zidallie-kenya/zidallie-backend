import { B2cMpesaTransaction } from '../../../../domain/b2c-mpesa-transaction';
import { B2cMpesaTransactionEntity } from '../entities/b2c_mpesa_transaction.entity';

export class B2cMpesaTransactionMapper {
  /**
   * Convert a persistence entity (from DB) to a domain model
   */
  static toDomain(entity: B2cMpesaTransactionEntity): B2cMpesaTransaction {
    return new B2cMpesaTransaction({
      id: entity.id,
      transactionId: entity.transactionId,
      conversationId: entity.conversationId,
      originatorConversationId: entity.originatorConversationId,
      resultType: entity.resultType,
      resultCode: entity.resultCode,
      resultDesc: entity.resultDesc,
      transactionAmount: entity.transactionAmount,
      receiverPartyPublicName: entity.receiverPartyPublicName,
      transactionCompletedAt: entity.transactionCompletedAt,
      rawResult: entity.rawResult,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Convert a domain model back to a persistence entity (for saving)
   */
  static toPersistence(domain: B2cMpesaTransaction): B2cMpesaTransactionEntity {
    const entity = new B2cMpesaTransactionEntity();
    entity.transactionId = domain.transactionId;
    entity.conversationId = domain.conversationId;
    entity.originatorConversationId = domain.originatorConversationId;
    entity.resultType = domain.resultType;
    entity.resultCode = domain.resultCode;
    entity.resultDesc = domain.resultDesc;
    entity.transactionAmount = domain.transactionAmount;
    entity.receiverPartyPublicName = domain.receiverPartyPublicName;
    entity.transactionCompletedAt = domain.transactionCompletedAt ?? null;
    entity.rawResult = domain.rawResult;
    entity.createdAt = domain.createdAt ?? new Date();
    entity.updatedAt = domain.updatedAt ?? new Date();
    return entity;
  }
}
