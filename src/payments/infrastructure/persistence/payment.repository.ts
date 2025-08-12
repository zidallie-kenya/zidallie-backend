import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Payment } from '../../domain/payment';
import { FilterPaymentDto, SortPaymentDto } from '../../dto/query-payment.dto';

export abstract class PaymentRepository {
  abstract create(
    data: Omit<Payment, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<Payment>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterPaymentDto | null;
    sortOptions?: SortPaymentDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Payment[]>;

  abstract findById(id: Payment['id']): Promise<NullableType<Payment>>;

  abstract findByIds(ids: Payment['id'][]): Promise<Payment[]>;

  abstract findByUserId(userId: Payment['user']['id']): Promise<Payment[]>;

  abstract findByTransactionId(
    transactionId: string,
  ): Promise<NullableType<Payment>>;

  abstract findByDateRange(startDate: Date, endDate: Date): Promise<Payment[]>;

  abstract getTotalAmountByUserId(
    userId: Payment['user']['id'],
  ): Promise<number>;

  abstract update(
    id: Payment['id'],
    payload: DeepPartial<Payment>,
  ): Promise<Payment | null>;

  abstract remove(id: Payment['id']): Promise<void>;
}
