import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Not, Repository } from 'typeorm';
import { SubscriptionEntity } from '../entities/subscription.entity';
import { SubscriptionMapper } from '../mappers/subscription.mapper';
import { Subscription } from '../../../../domain/subscription';

@Injectable()
export class SubscriptionRepository {
  private readonly repository: Repository<SubscriptionEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(SubscriptionEntity);
  }

  async createSubscription(
    manager: EntityManager,
    data: {
      student: any;
      plan: any;
      term?: any | null;
      amount?: number;
    },
  ): Promise<Subscription> {
    const entity = manager.create(SubscriptionEntity, {
      student: data.student,
      plan: data.plan,
      term: data.term ?? null,
      amount: data.amount ?? 0,
      status: 'active',
      total_paid: 0,
      balance: data.amount ?? 0,
      is_commission_paid: false,
      start_date: new Date(),
      expiry_date: this.calculateEndDate(),
    });

    const saved = await manager.save(entity);
    return SubscriptionMapper.toDomain(saved);
  }

  async findById(id: number): Promise<Subscription | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['student', 'plan', 'term'],
    });
    return entity ? SubscriptionMapper.toDomain(entity) : null;
  }

  async findActiveByStudentId(studentId: number): Promise<Subscription | null> {
    const entity = await this.repository.findOne({
      where: { student: { id: studentId }, status: Not('inactive') },
      relations: ['student', 'plan', 'term'],
    });
    return entity ? SubscriptionMapper.toDomain(entity) : null;
  }

  async findActiveEntityByStudentId(
    studentId: number,
  ): Promise<SubscriptionEntity | null> {
    return this.repository.findOne({
      where: { student: { id: studentId }, status: Not('inactive') },
      relations: ['student', 'plan', 'term'],
    });
  }

  async updateTotals(
    id: number,
    amountPaid: number,
  ): Promise<Subscription | null> {
    const subscription = await this.repository.findOne({ where: { id } });
    if (!subscription) return null;

    subscription.total_paid += amountPaid;
    subscription.balance = Math.max(
      subscription.amount - subscription.total_paid,
      0,
    );
    subscription.last_payment_date = new Date();

    const updated = await this.repository.save(subscription);
    return SubscriptionMapper.toDomain(updated);
  }

  async deactivateSubscription(id: number): Promise<void> {
    await this.repository.update(id, { status: 'inactive' });
  }

  async save(
    manager: EntityManager,
    subscription: Subscription,
  ): Promise<Subscription> {
    // Convert domain to persistence entity if needed
    const entity = SubscriptionMapper.toPersistence(subscription);
    const saved = await manager.save(SubscriptionEntity, entity);
    return SubscriptionMapper.toDomain(saved);
  }

  private calculateEndDate(): Date {
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    return now;
  }
}
