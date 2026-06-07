import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BookingEntity } from '../entities/booking.entity';

@Injectable()
export class BookingRepository {
  private readonly repo: Repository<BookingEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(BookingEntity);
  }

  // findById(id: number): Promise<BookingEntity | null> {
  //   return this.repo.findOne({
  //     where: { id },
  //     relations: [
  //       'parent',
  //       'carpool_school',
  //       'bus_school',
  //       'pickup_station',
  //       'cluster',
  //       'children',
  //       'deposits',
  //     ],
  //   });
  // }
  findById(id: number): Promise<BookingEntity | null> {
    return this.repo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.parent', 'parent')
      .leftJoinAndSelect('booking.carpool_school', 'carpool_school')
      .leftJoinAndSelect('booking.bus_school', 'bus_school')
      .leftJoinAndSelect('booking.pickup_station', 'pickup_station')
      .leftJoinAndSelect('booking.cluster', 'cluster')
      .leftJoinAndSelect('cluster.bookings', 'cluster_bookings') // ← critical
      .leftJoinAndSelect('booking.children', 'children')
      .leftJoinAndSelect('booking.deposits', 'deposits')
      .where('booking.id = :id', { id })
      .getOne();
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
