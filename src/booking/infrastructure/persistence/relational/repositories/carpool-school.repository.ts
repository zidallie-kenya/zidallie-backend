import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CarpoolSchoolEntity } from '../entities/carpool-school.entity';

@Injectable()
export class CarpoolSchoolRepository {
  private readonly repo: Repository<CarpoolSchoolEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(CarpoolSchoolEntity);
  }

  findAll(): Promise<CarpoolSchoolEntity[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findById(id: number): Promise<CarpoolSchoolEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  search(term: string): Promise<CarpoolSchoolEntity[]> {
    return this.repo
      .createQueryBuilder('s')
      .where('LOWER(s.name) LIKE :term', { term: `%${term.toLowerCase()}%` })
      .orderBy('s.name', 'ASC')
      .limit(10)
      .getMany();
  }
}
