import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { NullableType } from '../utils/types/nullable.type';
import { FilterPaymentDto, SortPaymentDto } from './dto/query-payment.dto';
import { PaymentRepository } from './infrastructure/persistence/payment.repository';
import { Payment } from './domain/payment';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UsersService } from '../users/users.service';
import { User } from '../users/domain/user';
import { PaymentKind, TransactionType } from '../utils/types/enums';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentRepository,
    private readonly usersService: UsersService,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    let user: User | undefined = undefined;
    if (createPaymentDto.userId) {
      const userEntity = await this.usersService.findById(
        createPaymentDto.userId,
      );
      if (!userEntity) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            user: 'This user does not exist',
          },
        });
      }
      user = userEntity;
    }

    if (!Object.values(PaymentKind).includes(createPaymentDto.kind)) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          kind: 'invalid payment kind',
        },
      });
    }

    if (
      !Object.values(TransactionType).includes(
        createPaymentDto.transaction_type,
      )
    ) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          transaction_type: 'invalid transaction type',
        },
      });
    }

    if (createPaymentDto.transaction_id) {
      const existingPayment = await this.paymentsRepository.findByTransactionId(
        createPaymentDto.transaction_id,
      );
      if (existingPayment) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            transaction_id: 'transaction id already exists',
          },
        });
      }
    }

    return this.paymentsRepository.create({
      user: user!,
      amount: createPaymentDto.amount,
      kind: createPaymentDto.kind,
      transaction_type: createPaymentDto.transaction_type,
      comments: createPaymentDto.comments ?? null,
      transaction_id: createPaymentDto.transaction_id ?? null,
    });
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterPaymentDto | null;
    sortOptions?: SortPaymentDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Payment[]> {
    return this.paymentsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: Payment['id']): Promise<NullableType<Payment>> {
    return this.paymentsRepository.findById(id);
  }

  findByIds(ids: Payment['id'][]): Promise<Payment[]> {
    return this.paymentsRepository.findByIds(ids);
  }

  findByUserId(userId: Payment['user']['id']): Promise<Payment[]> {
    return this.paymentsRepository.findByUserId(userId);
  }

  findByTransactionId(transactionId: string): Promise<NullableType<Payment>> {
    return this.paymentsRepository.findByTransactionId(transactionId);
  }

  findByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    return this.paymentsRepository.findByDateRange(startDate, endDate);
  }

  getTotalAmountByUserId(userId: Payment['user']['id']): Promise<number> {
    return this.paymentsRepository.getTotalAmountByUserId(userId);
  }

  async update(
    id: Payment['id'],
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment | null> {
    let user: User | undefined = undefined;
    if (updatePaymentDto.userId) {
      const userEntity = await this.usersService.findById(
        updatePaymentDto.userId,
      );
      if (!userEntity) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            user: 'this user does not exist',
          },
        });
      }
      user = userEntity;
    }

    if (
      updatePaymentDto.kind &&
      !Object.values(PaymentKind).includes(updatePaymentDto.kind)
    ) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          kind: 'invalid payment kind',
        },
      });
    }

    if (
      updatePaymentDto.transaction_type &&
      !Object.values(TransactionType).includes(
        updatePaymentDto.transaction_type,
      )
    ) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          transaction_type: 'invalid transactiont ype',
        },
      });
    }

    if (updatePaymentDto.transaction_id) {
      const existingPayment = await this.paymentsRepository.findByTransactionId(
        updatePaymentDto.transaction_id,
      );
      if (existingPayment && existingPayment.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            transaction_id: 'transaction Id already exists',
          },
        });
      }
    }

    return this.paymentsRepository.update(id, {
      user,
      amount: updatePaymentDto.amount,
      kind: updatePaymentDto.kind,
      transaction_type: updatePaymentDto.transaction_type,
      comments: updatePaymentDto.comments,
      transaction_id: updatePaymentDto.transaction_id,
    });
  }

  async remove(id: Payment['id']): Promise<void> {
    await this.paymentsRepository.remove(id);
  }
}
