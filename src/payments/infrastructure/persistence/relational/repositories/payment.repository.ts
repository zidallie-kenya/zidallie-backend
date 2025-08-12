import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, In } from 'typeorm';
import { PaymentEntity } from '../entities/payment.entity';
import { Payment } from '../../../../domain/payment';
import { PaymentMapper } from '../mappers/payment.mapper';
import {
  FilterPaymentDto,
  SortPaymentDto,
} from '../../../../dto/query-payment.dto';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { PaymentRepository } from '../../payment.repository';

@Injectable()
export class PaymentsRelationalRepository implements PaymentRepository {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentsRepository: Repository<PaymentEntity>,
  ) {}

  async create(data: Payment): Promise<Payment> {
    const persistenceModel = PaymentMapper.toPersistence(data);
    const newEntity = await this.paymentsRepository.save(
      this.paymentsRepository.create(persistenceModel),
    );
    return PaymentMapper.toDomain(newEntity);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterPaymentDto | null;
    sortOptions?: SortPaymentDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Payment[]> {
    const where: FindOptionsWhere<PaymentEntity> = {};

    if (filterOptions?.userId) {
      where.user = { id: Number(filterOptions.userId) };
    }

    if (filterOptions?.kind) {
      where.kind = filterOptions.kind;
    }

    if (filterOptions?.transaction_type) {
      where.transaction_type = filterOptions.transaction_type;
    }

    if (filterOptions?.transaction_id) {
      where.transaction_id = filterOptions.transaction_id;
    }

    if (filterOptions?.minAmount !== undefined) {
      // For amount range filtering, we'll use query builder
    }

    let queryBuilder = this.paymentsRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user');

    // Apply where conditions
    if (filterOptions?.userId) {
      queryBuilder = queryBuilder.andWhere('user.id = :userId', {
        userId: filterOptions.userId,
      });
    }

    if (filterOptions?.kind) {
      queryBuilder = queryBuilder.andWhere('payment.kind = :kind', {
        kind: filterOptions.kind,
      });
    }

    if (filterOptions?.transaction_type) {
      queryBuilder = queryBuilder.andWhere(
        'payment.transaction_type = :transactionType',
        {
          transactionType: filterOptions.transaction_type,
        },
      );
    }

    if (filterOptions?.transaction_id) {
      queryBuilder = queryBuilder.andWhere(
        'payment.transaction_id = :transactionId',
        {
          transactionId: filterOptions.transaction_id,
        },
      );
    }

    if (filterOptions?.minAmount !== undefined) {
      queryBuilder = queryBuilder.andWhere('payment.amount >= :minAmount', {
        minAmount: filterOptions.minAmount,
      });
    }

    if (filterOptions?.maxAmount !== undefined) {
      queryBuilder = queryBuilder.andWhere('payment.amount <= :maxAmount', {
        maxAmount: filterOptions.maxAmount,
      });
    }

    // Apply sorting
    if (sortOptions?.length) {
      sortOptions.forEach((sort) => {
        queryBuilder = queryBuilder.addOrderBy(
          `payment.${sort.orderBy}`,
          sort.order,
        );
      });
    } else {
      queryBuilder = queryBuilder.orderBy('payment.created_at', 'DESC');
    }

    // Apply pagination
    queryBuilder = queryBuilder
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .take(paginationOptions.limit);

    const entities = await queryBuilder.getMany();

    return entities.map((payment) => PaymentMapper.toDomain(payment));
  }

  async findById(id: Payment['id']): Promise<NullableType<Payment>> {
    const entity = await this.paymentsRepository.findOne({
      where: { id: Number(id) },
      relations: ['user'],
    });

    return entity ? PaymentMapper.toDomain(entity) : null;
  }

  async findByIds(ids: Payment['id'][]): Promise<Payment[]> {
    const entities = await this.paymentsRepository.find({
      where: { id: In(ids) },
      relations: ['user'],
    });

    return entities.map((payment) => PaymentMapper.toDomain(payment));
  }

  async findByUserId(userId: number): Promise<Payment[]> {
    const entities = await this.paymentsRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    return entities.map((payment) => PaymentMapper.toDomain(payment));
  }

  async findByTransactionId(
    transactionId: string,
  ): Promise<NullableType<Payment>> {
    const entity = await this.paymentsRepository.findOne({
      where: { transaction_id: transactionId },
      relations: ['user'],
    });

    return entity ? PaymentMapper.toDomain(entity) : null;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    const entities = await this.paymentsRepository
      .createQueryBuilder('payment')
      .where('payment.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .leftJoinAndSelect('payment.user', 'user')
      .orderBy('payment.created_at', 'DESC')
      .getMany();

    return entities.map((payment) => PaymentMapper.toDomain(payment));
  }

  async getTotalAmountByUserId(userId: number): Promise<number> {
    const result = await this.paymentsRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.user.id = :userId', { userId })
      .getRawOne();

    return Number(result.total) || 0;
  }

  async update(id: Payment['id'], payload: Partial<Payment>): Promise<Payment> {
    const entity = await this.paymentsRepository.findOne({
      where: { id: Number(id) },
      relations: ['user'],
    });

    if (!entity) {
      throw new Error('Payment not found');
    }

    const updatedEntity = await this.paymentsRepository.save(
      this.paymentsRepository.create(
        PaymentMapper.toPersistence({
          ...PaymentMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return PaymentMapper.toDomain(updatedEntity);
  }

  async remove(id: Payment['id']): Promise<void> {
    await this.paymentsRepository.delete(id);
  }
}
