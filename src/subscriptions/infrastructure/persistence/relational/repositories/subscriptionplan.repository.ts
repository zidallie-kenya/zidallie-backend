import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { SubscriptionPlanEntity } from '../entities/subscription_plans.entity';

@Injectable()
export class SubscriptionPlanRepository {
  private readonly repository: Repository<SubscriptionPlanEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(SubscriptionPlanEntity);
  }

  // Fetch a plan by ID
  public async findById(id: number): Promise<SubscriptionPlanEntity | null> {
    return this.repository.findOne({ where: { id } });
  }
}
