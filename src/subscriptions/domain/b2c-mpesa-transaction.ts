export class B2cMpesaTransaction {
  id?: number;
  transactionId: string;
  conversationId: string;
  originatorConversationId: string;
  resultType: number;
  resultCode: number;
  resultDesc: string;
  transactionAmount: number;
  receiverPartyPublicName: string;
  transactionCompletedAt: Date | null;
  rawResult: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(props: Partial<B2cMpesaTransaction>) {
    Object.assign(this, props);
  }
}
