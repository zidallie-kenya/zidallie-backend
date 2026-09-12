import { Injectable } from '@nestjs/common';
import { DataSource, In, MoreThanOrEqual, Repository } from 'typeorm';
import {
  BookingEntity,
  BookingStatus,
  BookingTerm,
} from '../entities/booking.entity';

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
    return this.repo.findOne({
      where: { id },
      relations: [
        'parent',
        'carpool_school',
        'bus_school',
        'pickup_station',
        'cluster',
        'cluster.bookings', // TypeORM handles nested relations like this
        'children',
        'children,student',
        'deposits',
      ],
    });
  }

  // findByParentId(parentId: number): Promise<BookingEntity[]> {
  //   return this.repo.find({
  //     where: { parent: { id: parentId } },
  //     relations: [
  //       'carpool_school',
  //       'bus_school',
  //       'pickup_station',
  //       'cluster',
  //       'children',
  //       'deposits',
  //     ],
  //     order: { created_at: 'DESC' },
  //   });
  // }

  findByParentId(
    parentId: number,
    minTotalPaid = 3000,
  ): Promise<BookingEntity[]> {
    return this.repo.find({
      where: {
        parent: { id: parentId },
        total_paid: MoreThanOrEqual(minTotalPaid),
      },
      relations: [
        'parent',
        'carpool_school',
        'bus_school',
        'pickup_station',
        'cluster',
        'cluster.bookings',
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

  async findPendingByParentId(parentId: number): Promise<BookingEntity | null> {
    return this.repo.findOne({
      where: { parent: { id: parentId }, status: 'pending' },
      order: { created_at: 'DESC' },
      relations: [
        'parent',
        'carpool_school',
        'bus_school',
        'pickup_station',
        'children',
      ],
    });
  }

  async findByTermAndStatuses(
    term: BookingTerm,
    statuses: BookingStatus[],
  ): Promise<BookingEntity[]> {
    return this.repo.find({
      where: {
        term,
        status: In(statuses),
      },
      relations: [
        'parent',
        'children',
        'children.student',
        'carpool_school',
        'bus_school',
        'pickup_station',
        'cluster',
      ],
    });
  }
}
