import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BookingReceiptEntity } from '../entities/booking-receipt.entity';

@Injectable()
export class BookingReceiptRepository {
  private readonly repo: Repository<BookingReceiptEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(BookingReceiptEntity);
  }

  async create(
    data: Partial<BookingReceiptEntity>,
  ): Promise<BookingReceiptEntity> {
    const receipt = this.repo.create(data);
    return this.repo.save(receipt);
  }

  findByParentId(parentId: number): Promise<BookingReceiptEntity[]> {
    return this.repo.find({
      where: { parent: { id: parentId } },
      relations: [
        'booking',
        'booking.carpool_school',
        'booking.bus_school',
        'booking.pickup_station',
      ],
      order: { paid_at: 'DESC' },
    });
  }

  findByBookingId(bookingId: number): Promise<BookingReceiptEntity[]> {
    return this.repo.find({
      where: { booking: { id: bookingId } },
      relations: ['booking'],
      order: { paid_at: 'DESC' },
    });
  }

  findByReference(reference: string): Promise<BookingReceiptEntity | null> {
    return this.repo.findOne({
      where: { reference },
      relations: [
        'booking',
        'booking.carpool_school',
        'booking.bus_school',
        'booking.pickup_station',
        'parent',
      ],
    });
  }

  generateReference(): string {
    // REC- followed by 6 random digits
    const digits = Math.floor(100000 + Math.random() * 900000).toString();
    return `REC-${digits}`;
  }
}
