import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ClusterEntity } from '../entities/cluster.entity';

@Injectable()
export class ClusterRepository {
  private readonly repo: Repository<ClusterEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(ClusterEntity);
  }

  findAll(): Promise<ClusterEntity[]> {
    return this.repo.find({ relations: ['bookings'] });
  }

  // findById(id: number): Promise<ClusterEntity | null> {
  //   return this.repo.findOne({ where: { id }, relations: ['bookings'] });
  // }

  findById(id: number): Promise<ClusterEntity | null> {
    return this.repo
      .createQueryBuilder('cluster')
      .leftJoinAndSelect('cluster.bookings', 'booking')
      .leftJoinAndSelect('booking.carpool_school', 'carpool_school')
      .where('cluster.id = :id', { id })
      .getOne();
  }

  findByTerm(term: string): Promise<ClusterEntity[]> {
    return this.repo
      .createQueryBuilder('cluster')
      .leftJoinAndSelect('cluster.bookings', 'booking')
      .leftJoinAndSelect('booking.carpool_school', 'carpool_school')
      .where('cluster.term = :term', { term })
      .andWhere('cluster.is_active = false') // only look at non-full clusters
      .getMany();
  }

  async create(data: Partial<ClusterEntity>): Promise<ClusterEntity> {
    const cluster = this.repo.create(data);
    const saved = await this.repo.save(cluster);
    // Auto-name like Django: Vehicle-001
    if (!saved.name) {
      saved.name = `Vehicle-${String(saved.id).padStart(3, '0')}`;
      await this.repo.save(saved);
    }
    return saved;
  }

  save(cluster: ClusterEntity): Promise<ClusterEntity> {
    return this.repo.save(cluster);
  }
}
