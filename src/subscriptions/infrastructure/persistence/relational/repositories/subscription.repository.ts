import { Repository, DataSource, EntityManager } from 'typeorm';
import { SubscriptionEntity } from '../entities/subscription.entity';
import { Injectable } from '@nestjs/common';
import { Subscription } from '../../../../domain/subscription';

@Injectable()
export class SubscriptionRepository {
  private readonly repository: Repository<SubscriptionEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(SubscriptionEntity);
  }

  async createSubscription(
    manager: EntityManager,
    student: any,
    plan: any,
    amount?: number,
  ): Promise<Subscription> {
    const subscription = manager.create(SubscriptionEntity, {
      student,
      plan,
      amount: amount ?? 0,
      status: 'active',
      start_date: new Date(),
      expiry_date: this.calculateEndDate(),
    });

    return manager.save(subscription);
  }

  async findById(id: number): Promise<Subscription | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['student'],
    });
  }

  async findActiveByStudentId(studentId: number): Promise<Subscription | null> {
    return this.repository.findOne({
      where: { student: { id: studentId }, status: 'active' },
      relations: ['student'],
    });
  }

  async deactivateSubscription(id: number): Promise<void> {
    await this.repository.update(id, { status: 'inactive' });
  }

  private calculateEndDate(): Date {
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    return now;
  }
}
