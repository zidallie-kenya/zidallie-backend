import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BusSchoolEntity } from '../entities/bus-school.entity';

@Injectable()
export class BusSchoolRepository {
  private readonly repo: Repository<BusSchoolEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(BusSchoolEntity);
  }

  findAll(): Promise<BusSchoolEntity[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findById(id: number): Promise<BusSchoolEntity | null> {
    return this.repo.findOne({ where: { id } });
  }
  findByRegion(region: string): Promise<BusSchoolEntity[]> {
    return this.repo
      .createQueryBuilder('s')
      .where('LOWER(s.region) = LOWER(:region)', { region })
      .orderBy('s.name', 'ASC')
      .getMany();
  }
}
