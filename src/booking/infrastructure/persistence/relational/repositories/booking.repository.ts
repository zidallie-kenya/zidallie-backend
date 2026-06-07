import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BookingEntity } from '../entities/booking.entity';

@Injectable()
export class BookingRepository {
  private readonly repo: Repository<BookingEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(BookingEntity);
  }

  findById(id: number): Promise<BookingEntity | null> {
    return this.repo.findOne({
      where: { id },
      relations: [
        'parent',
        'carpool_school',
        'bus_school',
        'pickup_station',
        'cluster',
        'children',
        'deposits',
      ],
    });
  }

  findByParentId(parentId: number): Promise<BookingEntity[]> {
    return this.repo.find({
      where: { parent: { id: parentId } },
      relations: [
        'carpool_school',
        'bus_school',
        'pickup_station',
        'cluster',
        'children',
        'deposits',
      ],
      order: { created_at: 'DESC' },
    });
  }

  create(data: Partial<BookingEntity>): Promise<BookingEntity> {
    const booking = this.repo.create(data);
    return this.repo.save(booking);
  }

  save(booking: BookingEntity): Promise<BookingEntity> {
    return this.repo.save(booking);
  }
}
