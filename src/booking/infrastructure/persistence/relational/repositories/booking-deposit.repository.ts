import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BookingDepositEntity } from '../entities/booking-deposit.entity';

@Injectable()
export class BookingDepositRepository {
  private readonly repo: Repository<BookingDepositEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(BookingDepositEntity);
  }

  findByCheckoutId(checkoutId: string): Promise<BookingDepositEntity | null> {
    return this.repo.findOne({
      where: { checkout_request_id: checkoutId },
      relations: ['booking', 'booking.parent'],
    });
  }

  findByBookingId(bookingId: number): Promise<BookingDepositEntity[]> {
    return this.repo.find({
      where: { booking: { id: bookingId } },
      order: { created_at: 'DESC' },
    });
  }

  create(data: Partial<BookingDepositEntity>): Promise<BookingDepositEntity> {
    const deposit = this.repo.create(data);
    return this.repo.save(deposit);
  }

  save(deposit: BookingDepositEntity): Promise<BookingDepositEntity> {
    return this.repo.save(deposit);
  }
}
