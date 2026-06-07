import { BookingChild } from '../../../../domain/booking-child';
import { BookingChildEntity } from '../entities/booking-child.entity';

// booking-child.mapper.ts
export class BookingChildMapper {
  static toDomain(entity: BookingChildEntity): BookingChild {
    return new BookingChild({
      id: entity.id,
      booking_id: entity.booking?.id,
      name: entity.name,
      grade_class: entity.grade_class,
      pickup_time: entity.pickup_time,
      dropoff_time: entity.dropoff_time,
      emergency_contact: entity.emergency_contact,
      emergency_contact_phone: entity.emergency_contact_phone,
      emergency_contact_email: entity.emergency_contact_email,
    });
  }

  static toPersistence(domain: BookingChild): Partial<BookingChildEntity> {
    const entity = new BookingChildEntity();
    if (domain.id) entity.id = domain.id;
    entity.name = domain.name;
    entity.grade_class = domain.grade_class;
    entity.pickup_time = domain.pickup_time;
    entity.dropoff_time = domain.dropoff_time;
    entity.emergency_contact = domain.emergency_contact;
    entity.emergency_contact_phone = domain.emergency_contact_phone;
    entity.emergency_contact_email = domain.emergency_contact_email;
    return entity;
  }
}
