import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PricingEntity } from '../entities/pricing.entity';

@Injectable()
export class PricingRepository {
  private readonly repo: Repository<PricingEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(PricingEntity);
  }

  async getPrice(
    region: string,
    distanceKm: number,
    serviceType: string,
  ): Promise<number | null> {
    const pricing = await this.repo
      .createQueryBuilder('p')
      .where('LOWER(p.region) = LOWER(:region)', { region })
      .andWhere('p.service_type = :serviceType', { serviceType })
      .andWhere('p.max_km >= :distance', { distance: Math.ceil(distanceKm) })
      .orderBy('p.max_km', 'ASC')
      .getOne();

    if (!pricing) return null;
    return Number(pricing.price);
  }
}
