import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PickupStationEntity } from '../entities/pickup-station.entity';

@Injectable()
export class PickupStationRepository {
  private readonly repo: Repository<PickupStationEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(PickupStationEntity);
  }

  findAll(): Promise<PickupStationEntity[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findById(id: number): Promise<PickupStationEntity | null> {
    return this.repo.findOne({ where: { id } });
  }
}
