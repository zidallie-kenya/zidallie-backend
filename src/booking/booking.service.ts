import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import axios from 'axios';
import { DataSource } from 'typeorm';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SubmitChildrenDto } from './dto/submit-children.dto';
import { InitiateDepositDto } from './dto/initiate-deposit.dto';
import { BookingRepository } from './infrastructure/persistence/relational/repositories/booking.repository';
import { BookingDepositRepository } from './infrastructure/persistence/relational/repositories/booking-deposit.repository';
import { CarpoolSchoolRepository } from './infrastructure/persistence/relational/repositories/carpool-school.repository';
import { BusSchoolRepository } from './infrastructure/persistence/relational/repositories/bus-school.repository';
import { PickupStationRepository } from './infrastructure/persistence/relational/repositories/pickup-station.repository';
import { PricingRepository } from './infrastructure/persistence/relational/repositories/pricing.repository';
import { ClusterRepository } from './infrastructure/persistence/relational/repositories/cluster.repository';
import {
  BookingEntity,
  BookingTerm,
} from './infrastructure/persistence/relational/entities/booking.entity';
import { BookingDepositEntity } from './infrastructure/persistence/relational/entities/booking-deposit.entity';
import { ClusterEntity } from './infrastructure/persistence/relational/entities/cluster.entity';
import { UsersService } from '../users/users.service';
import { BookingChildEntity } from './infrastructure/persistence/relational/entities/booking-child.entity';
import { StudentsService } from '../students/students.service';
import { RidesService } from '../rides/rides.service';
import { BookingReceiptRepository } from './infrastructure/persistence/relational/repositories/booking-receipt.repository';
import { ReceiptPaymentType } from './infrastructure/persistence/relational/entities/booking-receipt.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UserMeta } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { UpdateNotificationSettingsDto } from '../users/dto/update-notification-settings.dto';
import { ApplyDiscountDto } from '../students/dto/apply-discount.dto';

const DEPOSIT_PER_CHILD = 3000;
const CLUSTER_MIN = 3;
const CLUSTER_RADIUS_KM = 2.0;
const SCHOOL_DIRECTION_KM = 5.0;
const WAITLIST_DAYS = 15;

const LIVE_BOOKING_STATUSES = [
  'awaiting_cluster',
  'deposit_pending',
  'deposit_paid',
  'completed',
];

interface BookingPaymentSnapshot {
  id: number;
  totalPaidBefore: number;
  totalPaidAfter: number;
  depositAmount: number;
  totalPrice: number;
  status: string;
  serviceType: string;
  term: string;
  schoolName: string | null;
  homeArea: string | null;
  childrenCount: number;
  parentId: number;
}

@Injectable()
export class TransportBookingService {
  private readonly MPESA_BASEURL = process.env.MPESA_BASE_URL;
  private cachedToken: string | null = null;
  private tokenExpiry = 0;

  constructor(
    private readonly bookingRepo: BookingRepository,
    private readonly depositRepo: BookingDepositRepository,
    private readonly carpoolSchoolRepo: CarpoolSchoolRepository,
    private readonly busSchoolRepo: BusSchoolRepository,
    private readonly pickupStationRepo: PickupStationRepository,
    private readonly pricingRepo: PricingRepository,
    private readonly clusterRepo: ClusterRepository,
    private readonly dataSource: DataSource,
    private usersService: UsersService,
    private readonly studentsService: StudentsService,
    private readonly ridesService: RidesService,
    private readonly receiptRepo: BookingReceiptRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  private resolveReceiptName(
    totalPaidBefore: number,
    amountPaid: number,
    depositAmount: number,
    totalPrice: number,
  ): string {
    const totalAfter = totalPaidBefore + amountPaid;

    if (totalAfter >= totalPrice) return 'Full Transport Payment';
    if (totalPaidBefore === 0 && totalAfter < depositAmount)
      return 'Partial Deposit';
    if (totalPaidBefore === 0 && totalAfter >= depositAmount) return 'Deposit';
    if (totalPaidBefore < depositAmount && totalAfter >= depositAmount)
      return 'Deposit Completion';
    if (totalPaidBefore >= depositAmount) return 'Balance Payment';
    return 'Partial Deposit';
  }

  private resolvePaymentType(
    totalPaidBefore: number,
    amountPaid: number,
    depositAmount: number,
    totalPrice: number,
  ): ReceiptPaymentType {
    const totalAfter = totalPaidBefore + amountPaid;
    if (totalAfter >= totalPrice) return 'full_payment';
    if (totalAfter >= depositAmount && totalPaidBefore < depositAmount)
      return 'deposit';
    if (totalAfter < depositAmount) return 'partial_deposit';
    return 'balance';
  }

  private async recalculateClusterActivation(clusterId: number): Promise<void> {
    const cluster = await this.clusterRepo.findById(clusterId);
    if (!cluster) return;

    const liveBookings = (cluster.bookings ?? []).filter((b) =>
      LIVE_BOOKING_STATUSES.includes(b.status),
    );

    const totalChildren = liveBookings.reduce(
      (sum, b) => sum + Number(b.children_count),
      0,
    );

    cluster.seat_capacity = totalChildren;
    cluster.is_active = totalChildren >= CLUSTER_MIN;
    await this.clusterRepo.save(cluster);

    for (const b of liveBookings) {
      const shouldBeWaitlisted = !cluster.is_active;
      if (b.is_waitlisted !== shouldBeWaitlisted) {
        b.is_waitlisted = shouldBeWaitlisted;
        await this.bookingRepo.save(b);
      }
    }
  }
  //get all parents notifications
  async getMyNotifications(parentId: number) {
    return this.notificationsService.findByUserIdRaw(parentId);
  }
  async updateNotificationSettings(
    parentId: number,
    dto: UpdateNotificationSettingsDto,
  ): Promise<{ notifications: UserMeta['notifications'] }> {
    const user = await this.usersService.findById(parentId);
    if (!user) throw new NotFoundException('User not found');

    const existingMeta = user.meta ?? {};
    const existingNotifications = (existingMeta.notifications ?? {
      when_bus_leaves: true,
      when_bus_makes_home_drop_off: true,
      when_bus_make_home_pickup: true,
      when_bus_arrives: true,
      when_bus_is_1km_away: true,
      when_bus_is_0_5km_away: true,
    }) as UserMeta['notifications'];

    const updatedNotifications: UserMeta['notifications'] = {
      when_bus_leaves:
        dto.when_bus_leaves ?? existingNotifications.when_bus_leaves,
      when_bus_makes_home_drop_off:
        dto.when_bus_makes_home_drop_off ??
        existingNotifications.when_bus_makes_home_drop_off,
      when_bus_make_home_pickup:
        dto.when_bus_make_home_pickup ??
        existingNotifications.when_bus_make_home_pickup,
      when_bus_arrives:
        dto.when_bus_arrives ?? existingNotifications.when_bus_arrives,
      when_bus_is_1km_away:
        dto.when_bus_is_1km_away ?? existingNotifications.when_bus_is_1km_away,
      when_bus_is_0_5km_away:
        dto.when_bus_is_0_5km_away ??
        existingNotifications.when_bus_is_0_5km_away,
    };

    await this.usersService.update(parentId, {
      meta: {
        ...existingMeta,
        notifications: updatedNotifications,
      } as any,
    });

    return { notifications: updatedNotifications };
  }

  async getNotificationSettings(
    parentId: number,
  ): Promise<{ notifications: UserMeta['notifications'] | null }> {
    const user = await this.usersService.findById(parentId);
    if (!user) throw new NotFoundException('User not found');

    return {
      notifications: (user.meta?.notifications ?? null) as
        | UserMeta['notifications']
        | null,
    };
  }

  // Get Parent's students
  async getMyStudents(parentId: number) {
    return this.studentsService.findByParentId(parentId);
  }

  // Get all previous home addresses
  async getSavedAddresses(
    parentId: number,
  ): Promise<{ location: string; latitude: number; longitude: number }[]> {
    const rides = await this.ridesService.findByParentId(parentId);

    const seen = new Set<string>();
    const addresses: {
      location: string;
      latitude: number;
      longitude: number;
    }[] = [];

    for (const ride of rides) {
      const pickup = ride.schedule?.pickup;
      if (!pickup?.location) continue;

      // Deduplicate by location string
      if (!seen.has(pickup.location)) {
        seen.add(pickup.location);
        addresses.push({
          location: pickup.location,
          latitude: pickup.latitude,
          longitude: pickup.longitude,
        });
      }
    }

    return addresses;
  }

  // ─────────────────────────────────────────────
  // REFERENCE DATA ENDPOINTS
  // ─────────────────────────────────────────────

  getCarpoolSchools() {
    return this.carpoolSchoolRepo.findAll();
  }

  searchCarpoolSchools(term: string) {
    return this.carpoolSchoolRepo.search(term);
  }

  getBusSchools() {
    return this.busSchoolRepo.findAll();
  }

  getBusSchoolsByPickupStation(pickupStationId: number) {
    // Returns bus schools in the same region as the pickup station
    return this.pickupStationRepo.findById(pickupStationId).then((station) => {
      if (!station) throw new NotFoundException('Pickup station not found');
      return this.busSchoolRepo.findByRegion(station.region ?? '');
    });
  }

  getPickupStations() {
    return this.pickupStationRepo.findAll();
  }

  // ─────────────────────────────────────────────
  // STEP 1: CREATE BOOKING + CALCULATE PRICE
  // ─────────────────────────────────────────────

  // async createBooking(parentId: number, dto: CreateBookingDto) {
  //   let region: string | null = null;
  //   let distanceKm: number | null = null;
  //   let pricePerChild: number | null = null;

  //   const user = await this.usersService.findById(parentId);
  //   if (!user) {
  //     throw new UnprocessableEntityException({
  //       status: HttpStatus.UNPROCESSABLE_ENTITY,
  //       errors: {
  //         email: 'A parent with this id does not exist',
  //       },
  //     });
  //   }

  //   if (dto.service_type === 'carpool') {
  //     if (
  //       !dto.carpool_school_id ||
  //       dto.home_lat == null ||
  //       dto.home_lon == null
  //     ) {
  //       throw new BadRequestException(
  //         'Carpool requires carpool_school_id, home_lat, and home_lon',
  //       );
  //     }

  //     const school = await this.carpoolSchoolRepo.findById(
  //       dto.carpool_school_id,
  //     );
  //     if (!school) throw new NotFoundException('Carpool school not found');

  //     region = school.region;

  //     let schoolCoords: { lat: number; lon: number } | null = null;

  //     if (school.latitude != null && school.longitude != null) {
  //       schoolCoords = {
  //         lat: Number(school.latitude),
  //         lon: Number(school.longitude),
  //       };
  //     } else {
  //       // Fallback for schools not yet backfilled with manual coordinates
  //       const searchQuery = `${school.name}, ${region}, Nairobi, Kenya`;
  //       schoolCoords = await this.getCoordinates(searchQuery);
  //     }

  //     if (!schoolCoords) {
  //       throw new BadRequestException(
  //         `Could not locate ${school.name} in ${region}. Please verify the school details.`,
  //       );
  //     }

  //     distanceKm = this.haversineDistance(
  //       { lat: Number(dto.home_lat), lon: Number(dto.home_lon) },
  //       schoolCoords,
  //     );

  //     console.log('carpool home to school distance:', distanceKm);

  //     if (distanceKm >= 15.1 && distanceKm <= 20) {
  //       pricePerChild = 50600;
  //     } else if (distanceKm >= 20.1 && distanceKm <= 25) {
  //       pricePerChild = 55600;
  //     } else {
  //       pricePerChild = await this.pricingRepo.getPrice(
  //         region,
  //         distanceKm,
  //         'carpool',
  //       );
  //       if (!pricePerChild) {
  //         throw new BadRequestException(
  //           'The distance is out of our service range for your area.',
  //         );
  //       }
  //     }

  //     console.log('price per child', pricePerChild);

  //     // Apply 70% for one-way
  //     if (dto.trip_type === 'one_way') {
  //       pricePerChild = Math.round(pricePerChild * 0.7);
  //     }
  //   } else {
  //     // Bus
  //     if (!dto.bus_school_id || !dto.pickup_station_id) {
  //       throw new BadRequestException(
  //         'Bus service requires bus_school_id and pickup_station_id',
  //       );
  //     }

  //     const [busSchool, pickupStation] = await Promise.all([
  //       this.busSchoolRepo.findById(dto.bus_school_id),
  //       this.pickupStationRepo.findById(dto.pickup_station_id),
  //     ]);

  //     if (!busSchool) throw new NotFoundException('Bus school not found');
  //     if (!pickupStation)
  //       throw new NotFoundException('Pickup station not found');

  //     region = busSchool.region;

  //     let schoolCoords: { lat: number; lon: number } | null = null;

  //     if (busSchool.latitude != null && busSchool.longitude != null) {
  //       schoolCoords = {
  //         lat: Number(busSchool.latitude),
  //         lon: Number(busSchool.longitude),
  //       };
  //     } else {
  //       const schoolSearchQuery = `${busSchool.name}, ${region}, Nairobi, Kenya`;
  //       schoolCoords = await this.getCoordinates(schoolSearchQuery);
  //     }

  //     if (!schoolCoords) {
  //       throw new BadRequestException(
  //         `Could not locate school ${busSchool.name} in ${region}.`,
  //       );
  //     }

  //     // 2. Use the Pickup Station coordinates directly from the database
  //     // Ensuring we have valid numbers from the entity
  //     if (pickupStation.latitude == null || pickupStation.longitude == null) {
  //       throw new BadRequestException(
  //         'The selected pickup station does not have valid coordinates assigned.',
  //       );
  //     }

  //     const stationCoords = {
  //       lat: Number(pickupStation.latitude),
  //       lon: Number(pickupStation.longitude),
  //     };

  //     // 3. Calculate distance between the Database Station and Geocoded School
  //     console.log(stationCoords);
  //     console.log(schoolCoords);
  //     distanceKm = this.haversineDistance(stationCoords, schoolCoords);

  //     console.log('bus pickup station to school distance:', distanceKm);

  //     pricePerChild = await this.pricingRepo.getPrice(
  //       region,
  //       distanceKm,
  //       'bus',
  //     );
  //     console.log('price per child', pricePerChild);

  //     if (!pricePerChild) {
  //       throw new BadRequestException(
  //         'The distance is out of our service range for your area.',
  //       );
  //     }

  //     if (dto.trip_type === 'one_way') {
  //       pricePerChild = Math.round(pricePerChild * 0.7);
  //     }
  //   }

  //   const totalPrice = pricePerChild * dto.children_count;
  //   const depositAmount = DEPOSIT_PER_CHILD * dto.children_count;
  //   const balanceAmount = totalPrice - depositAmount;

  //   const booking = await this.bookingRepo.create({
  //     parent: { id: parentId } as any,
  //     service_type: dto.service_type,
  //     term: dto.term as any,
  //     trip_type: dto.trip_type as any,
  //     children_count: dto.children_count,
  //     carpool_school: dto.carpool_school_id
  //       ? ({ id: dto.carpool_school_id } as any)
  //       : null,
  //     home_area: dto.home_area ?? null,
  //     home_lat: dto.home_lat ?? null,
  //     home_lon: dto.home_lon ?? null,
  //     bus_school: dto.bus_school_id ? ({ id: dto.bus_school_id } as any) : null,
  //     pickup_station: dto.pickup_station_id
  //       ? ({ id: dto.pickup_station_id } as any)
  //       : null,
  //     region,
  //     distance_km: distanceKm,
  //     price_per_child: pricePerChild,
  //     total_price: totalPrice,
  //     deposit_amount: depositAmount,
  //     balance_amount: balanceAmount,
  //     is_waitlisted: true,
  //     status: 'pending',
  //   });

  //   return {
  //     booking_id: booking.id,
  //     service_type: booking.service_type,
  //     term: booking.term,
  //     trip_type: booking.trip_type,
  //     children_count: booking.children_count,
  //     region,
  //     distance_km: distanceKm,
  //     price_per_child: pricePerChild,
  //     total_price: totalPrice,
  //     deposit_amount: depositAmount,
  //     balance_amount: balanceAmount,
  //     home: booking.home_area || null,
  //     bus_pickup: booking.pickup_station || null,
  //     school: booking.bus_school || booking.carpool_school,
  //   };
  // }

  // ─────────────────────────────────────────────
  // STEP 2: SUBMIT CHILD DETAILS
  // ─────────────────────────────────────────────

  // async createBooking(parentId: number, dto: CreateBookingDto) {
  //   let region: string | null = null;
  //   let distanceKm: number | null = null;
  //   let pricePerChild: number | null = null;

  //   const user = await this.usersService.findById(parentId);
  //   if (!user) {
  //     throw new UnprocessableEntityException({
  //       status: HttpStatus.UNPROCESSABLE_ENTITY,
  //       errors: { email: 'A parent with this id does not exist' },
  //     });
  //   }

  //   if (dto.service_type === 'carpool') {
  //     if (
  //       !dto.carpool_school_id ||
  //       dto.home_lat == null ||
  //       dto.home_lon == null
  //     ) {
  //       throw new BadRequestException(
  //         'Carpool requires school_id, lat, and lon',
  //       );
  //     }

  //     const school = await this.carpoolSchoolRepo.findById(
  //       dto.carpool_school_id,
  //     );
  //     if (!school) throw new NotFoundException('Carpool school not found');

  //     region = school.region;
  //     const homeCoords = {
  //       lat: Number(dto.home_lat),
  //       lon: Number(dto.home_lon),
  //     };
  //     const schoolCoords =
  //       school.latitude && school.longitude
  //         ? { lat: Number(school.latitude), lon: Number(school.longitude) }
  //         : await this.getCoordinates(
  //             `${school.name}, ${region}, Nairobi, Kenya`,
  //           );

  //     if (!schoolCoords)
  //       throw new BadRequestException(`Could not locate school ${school.name}`);

  //     // GET ROAD DISTANCE
  //     distanceKm = await this.getRoadDistance(homeCoords, schoolCoords);

  //     // Fallback to Haversine if API fails
  //     if (distanceKm === null) {
  //       console.warn('Falling back to Haversine distance');
  //       distanceKm = this.haversineDistance(homeCoords, schoolCoords);
  //     }

  //     console.log('Carpool road distance:', distanceKm);

  //     // Pass distanceKm. For the database error, we ensure PricingRepo handles decimals
  //     pricePerChild = await this.pricingRepo.getPrice(
  //       region,
  //       distanceKm,
  //       'carpool',
  //     );

  //     console.log(pricePerChild);
  //   } else {
  //     // BUS LOGIC
  //     if (!dto.bus_school_id || !dto.pickup_station_id) {
  //       throw new BadRequestException(
  //         'Bus service requires school and station',
  //       );
  //     }

  //     const [busSchool, pickupStation] = await Promise.all([
  //       this.busSchoolRepo.findById(dto.bus_school_id),
  //       this.pickupStationRepo.findById(dto.pickup_station_id),
  //     ]);

  //     if (!busSchool || !pickupStation)
  //       throw new NotFoundException('School or Station not found');

  //     region = busSchool.region;
  //     const stationCoords = {
  //       lat: Number(pickupStation.latitude),
  //       lon: Number(pickupStation.longitude),
  //     };
  //     const schoolCoords =
  //       busSchool.latitude && busSchool.longitude
  //         ? {
  //             lat: Number(busSchool.latitude),
  //             lon: Number(busSchool.longitude),
  //           }
  //         : await this.getCoordinates(
  //             `${busSchool.name}, ${region}, Nairobi, Kenya`,
  //           );

  //     if (!schoolCoords)
  //       throw new BadRequestException(
  //         `Could not locate school ${busSchool.name}`,
  //       );

  //     // GET ROAD DISTANCE
  //     distanceKm = await this.getRoadDistance(stationCoords, schoolCoords);

  //     if (distanceKm === null) {
  //       distanceKm = this.haversineDistance(stationCoords, schoolCoords);
  //     }

  //     console.log('Bus road distance:', distanceKm);
  //     pricePerChild = await this.pricingRepo.getPrice(
  //       region,
  //       distanceKm,
  //       'bus',
  //     );
  //   }

  //   if (!pricePerChild) {
  //     throw new BadRequestException(
  //       'Distance out of service range for your area.',
  //     );
  //   }

  //   if (dto.trip_type === 'one_way') {
  //     pricePerChild = Math.round(pricePerChild * 0.7);
  //   }

  //   const totalPrice = pricePerChild * dto.children_count;
  //   const depositAmount = DEPOSIT_PER_CHILD * dto.children_count;

  //   const booking = await this.bookingRepo.create({
  //     parent: { id: parentId } as any,
  //     service_type: dto.service_type,
  //     term: dto.term as any,
  //     trip_type: dto.trip_type as any,
  //     children_count: dto.children_count,
  //     carpool_school: dto.carpool_school_id
  //       ? ({ id: dto.carpool_school_id } as any)
  //       : null,
  //     home_area: dto.home_area ?? null,
  //     home_lat: dto.home_lat ?? null,
  //     home_lon: dto.home_lon ?? null,
  //     bus_school: dto.bus_school_id ? ({ id: dto.bus_school_id } as any) : null,
  //     pickup_station: dto.pickup_station_id
  //       ? ({ id: dto.pickup_station_id } as any)
  //       : null,
  //     region,
  //     distance_km: distanceKm,
  //     price_per_child: pricePerChild,
  //     total_price: totalPrice,
  //     deposit_amount: depositAmount,
  //     balance_amount: totalPrice - depositAmount,
  //     is_waitlisted: true,
  //     status: 'pending',
  //   });

  //   return {
  //     ...booking,
  //     booking_id: booking.id,
  //     school: booking.bus_school || booking.carpool_school,
  //   };
  // }

  // async submitChildren(
  //   parentId: number,
  //   bookingId: number,
  //   dto: SubmitChildrenDto,
  // ) {
  //   const booking = await this.bookingRepo.findById(bookingId);
  //   if (!booking) throw new NotFoundException('Booking not found');

  //   if (booking.parent.id !== parentId)
  //     throw new BadRequestException('Unauthorized');

  //   if (dto.children.length !== booking.children_count) {
  //     throw new BadRequestException(
  //       `Expected ${booking.children_count} children`,
  //     );
  //   }

  //   // Map DTO to Entity objects
  //   booking.children = dto.children.map((c) => {
  //     const child = new BookingChildEntity();
  //     child.name = c.name;
  //     child.grade_class = c.grade_class ?? null;
  //     child.pickup_time = c.pickup_time ?? null;
  //     child.dropoff_time = c.dropoff_time ?? null;
  //     child.emergency_contact = c.emergency_contact;
  //     child.emergency_contact_phone = c.emergency_contact_phone;
  //     // Fix: Convert empty string to null for the database
  //     child.emergency_contact_email = c.emergency_contact_email?.trim() || null;
  //     return child;
  //   });

  //   booking.status = 'awaiting_cluster';
  //   booking.is_waitlisted = true;
  //   booking.waitlist_started_at = new Date();

  //   // This will now save children IF cascade: true is set in BookingEntity
  //   return await this.bookingRepo.save(booking);
  // }

  async createBooking(parentId: number, dto: CreateBookingDto) {
    let region: string | null = null;
    let distanceKm: number | null = null;
    let pricePerChild: number | null = null;

    const user = await this.usersService.findById(parentId);
    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { email: 'A parent with this id does not exist' },
      });
    }

    if (dto.service_type === 'carpool') {
      if (
        !dto.carpool_school_id ||
        dto.home_lat == null ||
        dto.home_lon == null
      ) {
        throw new BadRequestException(
          'Carpool requires school_id, lat, and lon',
        );
      }

      const school = await this.carpoolSchoolRepo.findById(
        dto.carpool_school_id,
      );
      if (!school) throw new NotFoundException('Carpool school not found');

      region = school.region;
      const homeCoords = {
        lat: Number(dto.home_lat),
        lon: Number(dto.home_lon),
      };
      const schoolCoords =
        school.latitude && school.longitude
          ? { lat: Number(school.latitude), lon: Number(school.longitude) }
          : await this.getCoordinates(
              `${school.name}, ${region}, Nairobi, Kenya`,
            );

      if (!schoolCoords)
        throw new BadRequestException(`Could not locate school ${school.name}`);

      distanceKm = await this.getRoadDistance(homeCoords, schoolCoords);

      if (distanceKm === null) {
        console.warn('Falling back to Haversine distance');
        distanceKm = this.haversineDistance(homeCoords, schoolCoords);
      }

      console.log('Carpool road distance:', distanceKm);

      pricePerChild = await this.pricingRepo.getPrice(
        region,
        distanceKm,
        'carpool',
      );

      console.log(pricePerChild);
    } else {
      if (!dto.bus_school_id || !dto.pickup_station_id) {
        throw new BadRequestException(
          'Bus service requires school and station',
        );
      }

      const [busSchool, pickupStation] = await Promise.all([
        this.busSchoolRepo.findById(dto.bus_school_id),
        this.pickupStationRepo.findById(dto.pickup_station_id),
      ]);

      if (!busSchool || !pickupStation)
        throw new NotFoundException('School or Station not found');

      region = busSchool.region;
      const stationCoords = {
        lat: Number(pickupStation.latitude),
        lon: Number(pickupStation.longitude),
      };
      const schoolCoords =
        busSchool.latitude && busSchool.longitude
          ? {
              lat: Number(busSchool.latitude),
              lon: Number(busSchool.longitude),
            }
          : await this.getCoordinates(
              `${busSchool.name}, ${region}, Nairobi, Kenya`,
            );

      if (!schoolCoords)
        throw new BadRequestException(
          `Could not locate school ${busSchool.name}`,
        );

      distanceKm = await this.getRoadDistance(stationCoords, schoolCoords);

      if (distanceKm === null) {
        distanceKm = this.haversineDistance(stationCoords, schoolCoords);
      }

      console.log('Bus road distance:', distanceKm);
      pricePerChild = await this.pricingRepo.getPrice(
        region,
        distanceKm,
        'bus',
      );
    }

    if (!pricePerChild) {
      throw new BadRequestException(
        'Distance out of service range for your area.',
      );
    }

    if (dto.trip_type === 'one_way') {
      pricePerChild = Math.round(pricePerChild * 0.7);
    }

    const totalPrice = pricePerChild * dto.children_count;
    const depositAmount = DEPOSIT_PER_CHILD * dto.children_count;

    const bookingData: Partial<BookingEntity> = {
      parent: { id: parentId } as any,
      service_type: dto.service_type,
      term: dto.term as any,
      trip_type: dto.trip_type as any,
      children_count: dto.children_count,
      carpool_school: dto.carpool_school_id
        ? ({ id: dto.carpool_school_id } as any)
        : null,
      home_area: dto.home_area ?? null,
      home_lat: dto.home_lat ?? null,
      home_lon: dto.home_lon ?? null,
      bus_school: dto.bus_school_id ? ({ id: dto.bus_school_id } as any) : null,
      pickup_station: dto.pickup_station_id
        ? ({ id: dto.pickup_station_id } as any)
        : null,
      region,
      distance_km: distanceKm,
      price_per_child: pricePerChild,
      total_price: totalPrice,
      deposit_amount: depositAmount,
      balance_amount: totalPrice - depositAmount,
      is_waitlisted: true,
      status: 'pending',
    };

    // Reuse the parent's existing draft booking instead of inserting a new
    // row every time the booking flow is re-entered (e.g. app closed mid-flow).
    const existingDraft =
      await this.bookingRepo.findPendingByParentId(parentId);

    const booking = existingDraft
      ? await this.bookingRepo.save(Object.assign(existingDraft, bookingData))
      : await this.bookingRepo.create(bookingData);

    return {
      ...booking,
      booking_id: booking.id,
      school: booking.bus_school || booking.carpool_school,
    };
  }

  async submitChildren(
    parentId: number,
    bookingId: number,
    dto: SubmitChildrenDto,
  ) {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.parent.id !== parentId)
      throw new BadRequestException('Unauthorized');

    if (dto.children.length !== booking.children_count) {
      throw new BadRequestException(
        `Expected ${booking.children_count} children`,
      );
    }

    // Sequential on purpose: two children with the same name in the same
    // submission (twins, a typo) must not both run their "does this student
    // exist?" lookup before either has been created — that would create two
    // duplicate student rows instead of reusing one.
    const children: BookingChildEntity[] = [];

    for (const c of dto.children) {
      const child = new BookingChildEntity();
      child.name = c.name;
      child.grade_class = c.grade_class ?? null;
      child.pickup_time = c.pickup_time ?? null;
      child.dropoff_time = c.dropoff_time ?? null;
      child.emergency_contact = c.emergency_contact;
      child.emergency_contact_phone = c.emergency_contact_phone;
      // Fix: Convert empty string to null for the database
      child.emergency_contact_email = c.emergency_contact_email?.trim() || null;

      const student = await this.studentsService.findOrCreateForBooking({
        parentId,
        name: c.name,
        serviceType: booking.service_type,
        emergencyContactPhone: c.emergency_contact_phone,
        emergencyContact: c.emergency_contact,
        homeArea: booking.home_area,
        region: booking.region,
      });
      // findOrCreateForBooking returns the domain Student, not a
      // StudentEntity — only the id is needed to set the FK on save.
      child.student = { id: student.id } as any;

      children.push(child);
    }

    booking.children = children;

    booking.status = 'awaiting_cluster';
    booking.is_waitlisted = true;
    booking.waitlist_started_at = new Date();

    // This will now save children IF cascade: true is set in BookingEntity
    return await this.bookingRepo.save(booking);
  }

  // ─────────────────────────────────────────────
  // STEP 3: INITIATE DEPOSIT PAYMENT
  // ─────────────────────────────────────────────

  async initiateDeposit(
    parentId: number,
    bookingId: number,
    dto: InitiateDepositDto,
  ) {
    //verify data
    if (!dto.amount && !dto.phone_number) {
      throw new Error('Missing amount and phone number. They are required');
    }

    //get mpesa credentials
    const consumerKey = process.env.MPESA_CONSUMER_KEY!;
    const secretKey = process.env.MPESA_SECRET_KEY!;
    if (!consumerKey || !secretKey) {
      console.log('Missing M-Pesa credentials');
      throw new Error('Missing M-Pesa credentials');
    }

    // get access token from safaricom and get booking
    const [booking, accessToken] = await Promise.all([
      this.bookingRepo.findById(bookingId),
      this.getAccessToken(consumerKey, secretKey),
    ]);

    //verify bookingid from user
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.parent.id !== parentId)
      throw new BadRequestException(
        'The provided parent id doesnt match the booking parent',
      );

    // 1. Calculate Expiry Logic
    if (booking.waitlist_started_at) {
      const WAITLIST_LIMIT_DAYS = 15;
      const expiryDate = new Date(booking.waitlist_started_at);
      expiryDate.setDate(expiryDate.getDate() + WAITLIST_LIMIT_DAYS);

      if (new Date() > expiryDate) {
        const clusterId = booking.cluster?.id ?? null;
        booking.status = 'cancelled';
        await this.bookingRepo.save(booking);

        if (clusterId) {
          await this.recalculateClusterActivation(clusterId);
        }

        throw new BadRequestException(
          'The 15-day waitlist period has expired. This booking is now cancelled.',
        );
      }
    }

    const allowedStatuses: string[] = [
      'awaiting_cluster',
      'deposit_pending',
      'deposit_paid',
    ];
    if (!allowedStatuses.includes(booking.status)) {
      throw new BadRequestException(
        `Booking is not in a state to accept payment (Status: ${booking.status})`,
      );
    }
    console.log('initatiating booking payment');
    console.log(`Amount: ${dto.amount}, Phone Number: ${dto.phone_number}`);

    const timestamp = this.getTimestamp();

    const password = Buffer.from(
      `${process.env.MPESA_C2B_PAYBILL}${process.env.MPESA_PASS_KEY}${timestamp}`,
    ).toString('base64');

    const requestData = {
      BusinessShortCode: process.env.MPESA_C2B_PAYBILL,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: dto.amount,
      PartyA: dto.phone_number,
      PartyB: process.env.MPESA_C2B_PAYBILL,
      PhoneNumber: dto.phone_number,
      CallBackURL:
        'https://zidallie-backend.onrender.com/api/v1/transport-bookings/deposit-callback',
      AccountReference: `BOOKING-${bookingId}`,
      TransactionDesc: 'TRANSPORT BOOKING DEPOSIT',
    };

    try {
      const response = await axios.post(
        `${this.MPESA_BASEURL}/mpesa/stkpush/v1/processrequest`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = response.data;
      if (data.ResponseCode !== '0' && data.ResponseCode !== 0) {
        throw new BadRequestException(
          data.ResponseDescription || 'M-Pesa error',
        );
      }

      // Determine if this is a deposit or full payment
      const paymentType =
        dto.amount >= Number(booking.total_price) ? 'full' : 'deposit';

      const deposit = await this.depositRepo.create({
        booking: { id: bookingId } as any,
        parent: { id: parentId } as any,
        amount: dto.amount,
        phone_number: dto.phone_number,
        checkout_request_id: data.CheckoutRequestID,
        status: 'pending',
        payment_type: paymentType,
      });

      return {
        message: 'Payment initiated. Check your phone for M-Pesa prompt.',
        checkout_request_id: data.CheckoutRequestID,
        deposit_id: deposit.id,
        amount: dto.amount,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        'Failed to initiate payment. Please try again.',
      );
    }
  }

  async applyDiscountCode(
    parentId: number,
    bookingId: number,
    dto: ApplyDiscountDto,
  ) {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.parent.id !== parentId) {
      throw new BadRequestException('Unauthorized');
    }

    const code = (dto.code || '').trim().toUpperCase();

    // ── IDEMPOTENT GUARD: prevent stacking, allow safe re-submission ──
    if (booking.discount_code_applied) {
      if (booking.discount_code_applied === code) {
        // Same code re-submitted (app reopened, retried, etc.) — no-op success.
        console.log('Discount already applied to this booking.');
        return {
          applicable: true,
          message: 'Discount already applied to this booking.',
          amount_due: Number(booking.balance_amount),
        };
      }
      // A different code — block stacking.
      console.log(
        `A discount (${booking.discount_code_applied}) is already applied to this booking.`,
      );
      return {
        applicable: false,
        message: `A discount (${booking.discount_code_applied}) is already applied to this booking.`,
        amount_due: Number(booking.balance_amount),
      };
    }

    const totalPaid = Number(booking.total_paid || 0);
    const depositAmount = Number(booking.deposit_amount || 0);
    const balanceAmount = Number(booking.balance_amount || 0);
    const totalPrice = Number(booking.total_price || 0);

    const payingDeposit = totalPaid < depositAmount;
    const baseAmount = payingDeposit ? depositAmount : balanceAmount;

    // Match by name instead of blindly grabbing the parent's first student —
    // a booking can be for any of the parent's children.
    const matchedStudents = await this.findMatchingStudents(parentId, booking);
    const student = matchedStudents[0] ?? null;

    console.log('Student that matched:', student.name);

    const notApplicable = {
      applicable: false,
      message: 'This is not applicable for this account',
      amount_due: baseAmount,
    };

    const persistDiscount = async (discount: number, appliedCode: string) => {
      booking.total_price = totalPrice - discount;
      if (payingDeposit) {
        booking.deposit_amount = depositAmount - discount;
      }
      booking.balance_amount = Math.max(0, booking.total_price - totalPaid);
      booking.discount_code_applied = appliedCode;
      booking.discount_amount_applied = discount;
      await this.bookingRepo.save(booking);
    };

    if (code === 'ZIDONEWAY') {
      const discountedAmount = Math.round(baseAmount * 0.85);
      const discount = baseAmount - discountedAmount;

      if (matchedStudents.length) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 7);
        await Promise.all(
          matchedStudents.map((s) =>
            this.studentsService.update(s.id, {
              discount_code: 'ZIDONEWAY',
              discount_code_expiry: expiry,
            } as any),
          ),
        );
      }

      await persistDiscount(discount, 'ZIDONEWAY');

      return {
        applicable: true,
        message: 'One-way discount applied.',
        amount_due: discountedAmount,
      };
    }

    if (code === 'ZIDSPECIAL') {
      if (!student) return notApplicable;

      const expiry = student.discount_code_expiry
        ? new Date(student.discount_code_expiry)
        : null;
      const isExpired = !expiry || expiry.getTime() < Date.now();

      const log_text = isExpired
        ? 'The discount has Expired'
        : 'Discount code is still valid';
      console.log(log_text);

      if (isExpired) return notApplicable;
      if (student.discount_code !== 'ZIDSPECIAL') {
        console.log(
          `student discount code did not match, student code: ${student.discount_code}`,
        );
        return notApplicable;
      }

      const discountAmount = Number(student.discount_code_amount || 0);
      const discountedAmount = Math.max(0, baseAmount - discountAmount);
      const discount = baseAmount - discountedAmount;

      await persistDiscount(discount, 'ZIDSPECIAL');

      return {
        applicable: true,
        message: `Special rate applied: KES ${discountAmount.toLocaleString()} off.`,
        amount_due: discountedAmount,
      };
    }

    return notApplicable;
  }

  // private async findMatchingStudents(parentId: number, booking: BookingEntity) {
  //   const students = await this.studentsService.findByParentId(parentId);
  //   if (!students?.length) return [];

  //   const childNames = (booking.children ?? [])
  //     .map((c) => c.name?.trim().toLowerCase())
  //     .filter((n): n is string => !!n);

  //   if (!childNames.length) return [];

  //   return students.filter((s) =>
  //     childNames.includes((s.name ?? '').trim().toLowerCase()),
  //   );
  // }

  // ─────────────────────────────────────────────
  // STEP 4: M-PESA CALLBACK → CLUSTER LOGIC
  // ─────────────────────────────────────────────

  private async findMatchingStudents(parentId: number, booking: BookingEntity) {
    const children = booking.children ?? [];
    if (!children.length) return [];

    // Prefer the FK — it's authoritative and was set at submitChildren time.
    const linkedStudentIds = children
      .map((c) => c.student?.id)
      .filter((id): id is number => id != null);

    // Fall back to name matching only for children that predate the
    // student_id migration (or somehow never got linked).
    const unlinkedChildren = children.filter((c) => c.student?.id == null);

    const [linkedStudents, allParentStudents] = await Promise.all([
      linkedStudentIds.length
        ? this.studentsService.findByIds(linkedStudentIds)
        : Promise.resolve([]),
      unlinkedChildren.length
        ? this.studentsService.findByParentId(parentId)
        : Promise.resolve([]),
    ]);

    const nameMatchedStudents = unlinkedChildren.length
      ? (() => {
          const unlinkedNames = unlinkedChildren
            .map((c) => c.name?.trim().toLowerCase())
            .filter((n): n is string => !!n);

          return allParentStudents.filter((s) =>
            unlinkedNames.includes((s.name ?? '').trim().toLowerCase()),
          );
        })()
      : [];

    // Dedupe in case a student somehow shows up via both paths.
    const seen = new Set<number>();
    return [...linkedStudents, ...nameMatchedStudents].filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }
  async handleDepositCallback(receivedData: any) {
    const stkCallback = receivedData?.Body?.stkCallback;
    if (!stkCallback) {
      console.log('Received invalid M-Pesa callback.');
      return { ResultCode: 0, ResultDesc: 'Accepted' };
    }

    if (stkCallback.ResultCode !== 0) {
      console.log(`Deposit payment failed: ${stkCallback.ResultDesc}`);
      const checkoutId = stkCallback.CheckoutRequestID;
      const deposit = await this.depositRepo.findByCheckoutId(checkoutId);
      if (deposit) {
        deposit.status = 'failed';
        await this.depositRepo.save(deposit);
      }
      return { ResultCode: 0, ResultDesc: 'Accepted' };
    }

    const metadata = stkCallback.CallbackMetadata?.Item || [];
    const amount = metadata[0]?.Value;
    const checkoutId = stkCallback.CheckoutRequestID;
    const mpesaTransactionId = metadata[1]?.Value;

    const snapshotHolder: { data: BookingPaymentSnapshot | null } = {
      data: null,
    };

    console.log(
      `Deposit Amount received: ${amount} from phone number: ${mpesaTransactionId} for CheckoutRequestID: ${checkoutId}`,
    );

    try {
      // ── TRANSACTION: update deposit + booking ──────────────────────────
      await this.dataSource.transaction(async (manager) => {
        const depositRepo = manager.getRepository(BookingDepositEntity);
        const bookingRepo = manager.getRepository(BookingEntity);

        console.log('depositRepo and bookingRepo called');

        const initialDeposit = await depositRepo.findOne({
          where: { checkout_request_id: checkoutId },
          relations: ['booking'],
        });

        console.log(
          'initialDeposit==============================================>',
          initialDeposit,
        );
        if (!initialDeposit) {
          console.log('initialDeposit is null');
          return;
        }

        const deposit = await depositRepo.findOne({
          where: { id: initialDeposit.id },
          lock: { mode: 'pessimistic_write' },
        });

        const bookingToUpdate = await bookingRepo.findOne({
          where: { id: initialDeposit.booking.id },
          lock: { mode: 'pessimistic_write' },
        });

        console.log(
          'deposit==============================================>',
          deposit,
        );

        if (!deposit || deposit.status === 'paid' || !bookingToUpdate) return;

        const totalPaidBefore = Number(bookingToUpdate.total_paid || 0);
        const depositAmount = Number(bookingToUpdate.deposit_amount || 0);
        const totalPrice = Number(bookingToUpdate.total_price || 0);

        deposit.status = 'paid';
        deposit.mpesa_transaction_id = mpesaTransactionId;
        await manager.save(deposit);

        bookingToUpdate.total_paid = totalPaidBefore + Number(amount);
        bookingToUpdate.balance_amount = Math.max(
          0,
          totalPrice - bookingToUpdate.total_paid,
        );

        if (bookingToUpdate.total_paid >= totalPrice) {
          bookingToUpdate.status = 'completed';
        } else if (bookingToUpdate.total_paid >= depositAmount) {
          bookingToUpdate.status = 'deposit_paid';
        } else {
          bookingToUpdate.status = 'deposit_pending';
        }

        console.log(
          'bookingToUpdate==============================================>',
          bookingToUpdate,
        );
        await manager.save(bookingToUpdate);

        const bookingWithData = await bookingRepo.findOne({
          where: { id: bookingToUpdate.id },
          relations: [
            'carpool_school',
            'bus_school',
            'pickup_station',
            'parent',
          ],
        });

        console.log(
          'BookingWithData==============================================>',
          bookingWithData,
        );

        if (bookingWithData) {
          snapshotHolder.data = {
            id: bookingWithData.id,
            totalPaidBefore,
            totalPaidAfter: bookingWithData.total_paid,
            depositAmount,
            totalPrice,
            status: bookingWithData.status,
            serviceType: bookingWithData.service_type,
            term: bookingWithData.term,
            schoolName:
              bookingWithData.carpool_school?.name ??
              bookingWithData.bus_school?.name ??
              null,
            homeArea: bookingWithData.home_area ?? null,
            childrenCount: bookingWithData.children_count,
            parentId: bookingWithData.parent.id,
          };
        }
      }); // ← transaction closes here

      // ── POST-TRANSACTION: generate receipt + cluster logic ─────────────
      console.log(
        'snapshotholder.data==============================================>',
        snapshotHolder.data,
      );
      if (snapshotHolder.data) {
        const snap = snapshotHolder.data;
        const balanceRemaining = Math.max(
          0,
          snap.totalPrice - snap.totalPaidAfter,
        );

        const receiptName = this.resolveReceiptName(
          snap.totalPaidBefore,
          Number(amount),
          snap.depositAmount,
          snap.totalPrice,
        );

        const paymentType = this.resolvePaymentType(
          snap.totalPaidBefore,
          Number(amount),
          snap.depositAmount,
          snap.totalPrice,
        );

        let reference = this.receiptRepo.generateReference();
        const existing = await this.receiptRepo.findByReference(reference);
        if (existing) reference = this.receiptRepo.generateReference();

        await this.receiptRepo.create({
          reference,
          parent: { id: snap.parentId } as any,
          booking: { id: snap.id } as any,
          name: receiptName,
          term: snap.term,
          amount: Number(amount),
          balance_remaining: balanceRemaining,
          payment_type: paymentType,
          service_type: snap.serviceType as any,
          school_name: snap.schoolName,
          home_location: snap.homeArea,
          children_count: snap.childrenCount,
          payment_method: 'M-Pesa',
          mpesa_transaction_id: mpesaTransactionId ?? null,
        });

        console.log(`Receipt ${reference} created for booking ${snap.id}`);

        if (snap.serviceType === 'carpool') {
          await this.runClusterLogic(snap.id);
        } else {
          const booking = await this.bookingRepo.findById(snap.id);
          if (booking) {
            booking.is_waitlisted = false;
            await this.bookingRepo.save(booking);
          }
        }
      }
    } catch (error: any) {
      console.error('Error handling deposit callback:', error.message);
    }

    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }
  // ─────────────────────────────────────────────
  // CLUSTER LOGIC
  // ─────────────────────────────────────────────

  private async runClusterLogic(bookingId: number) {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) return;

    if (booking.service_type !== 'carpool') {
      booking.is_waitlisted = false;
      await this.bookingRepo.save(booking);
      return;
    }

    const cluster = await this.findOrCreateCluster(booking);
    booking.cluster = cluster;
    await this.bookingRepo.save(booking);

    await this.recalculateClusterActivation(cluster.id);
  }

  private async findOrCreateCluster(
    booking: BookingEntity,
  ): Promise<ClusterEntity> {
    console.log(
      `Finding cluster for booking ${booking.id}, term: ${booking.term}`,
    );

    if (!booking.home_lat || !booking.home_lon) {
      return this.clusterRepo.create({
        term: booking.term,
        zone: booking.region ?? 'General',
      });
    }

    const newCoords = {
      lat: Number(booking.home_lat),
      lon: Number(booking.home_lon),
    };

    const clusters = await this.clusterRepo.findByTerm(booking.term);

    for (const cluster of clusters) {
      const liveBookings = (cluster.bookings ?? []).filter((b) =>
        LIVE_BOOKING_STATUSES.includes(b.status),
      );
      const liveChildren = liveBookings.reduce(
        (sum, b) => sum + Number(b.children_count),
        0,
      );

      // Would adding this booking push the cluster over its seat capacity?
      if (liveChildren + booking.children_count > cluster.max_capacity) {
        continue;
      }

      const anchor = liveBookings[0];
      if (!anchor) continue;

      const anchorCoords = {
        lat: Number(anchor.home_lat),
        lon: Number(anchor.home_lon),
      };

      const proximityOk =
        this.haversineDistance(newCoords, anchorCoords) <= CLUSTER_RADIUS_KM;
      if (!proximityOk) continue;

      const sameDirectionOk = await this.isInSameDirection(booking, anchor);
      if (sameDirectionOk) return cluster;
    }

    return this.clusterRepo.create({
      term: booking.term,
      zone: booking.region ?? 'General',
      is_active: false,
    });
  }

  // private async findOrCreateCluster(
  //   booking: BookingEntity,
  // ): Promise<ClusterEntity> {
  //   console.log(
  //     `Finding cluster for booking ${booking.id}, term: ${booking.term}`,
  //   );

  //   if (!booking.home_lat || !booking.home_lon) {
  //     console.log('No coords — creating new cluster');

  //     return this.clusterRepo.create({
  //       term: booking.term,
  //       zone: booking.region ?? 'General',
  //     });
  //   }

  //   const newCoords = {
  //     lat: Number(booking.home_lat),
  //     lon: Number(booking.home_lon),
  //   };

  //   // 1. Search existing clusters for this term
  //   const clusters = await this.clusterRepo.findByTerm(booking.term);

  //   for (const cluster of clusters) {
  //     if ((cluster.bookings?.length ?? 0) >= cluster.max_capacity) continue;

  //     const anchor = cluster.bookings?.[0];
  //     if (!anchor) continue;

  //     const anchorCoords = {
  //       lat: Number(anchor.home_lat),
  //       lon: Number(anchor.home_lon),
  //     };

  //     // haversine_distance <= 2.0
  //     const proximityOk =
  //       this.haversineDistance(newCoords, anchorCoords) <= CLUSTER_RADIUS_KM;
  //     if (!proximityOk) continue;

  //     // Check school direction (only if carpool schools differ)
  //     const sameDirectionOk = await this.isInSameDirection(booking, anchor);
  //     if (sameDirectionOk) {
  //       return cluster;
  //     }
  //   }

  //   // No suitable cluster — create new one
  //   console.log('creating new cluster');
  //   return this.clusterRepo.create({
  //     term: booking.term,
  //     zone: booking.region ?? 'General',
  //     is_active: false,
  //   });
  // }

  private async isInSameDirection(
    newBooking: BookingEntity,
    anchor: BookingEntity,
  ): Promise<boolean> {
    if (!newBooking.carpool_school || !anchor.carpool_school) return true;
    if (newBooking.carpool_school.id === anchor.carpool_school.id) return true;

    const [newSchoolCoords, anchorSchoolCoords] = await Promise.all([
      this.getCoordinates(newBooking.carpool_school.name + ', Nairobi, Kenya'),
      this.getCoordinates(anchor.carpool_school.name + ', Nairobi, Kenya'),
    ]);

    if (!newSchoolCoords || !anchorSchoolCoords) return true; // Fail open

    return (
      this.haversineDistance(newSchoolCoords, anchorSchoolCoords) <=
      SCHOOL_DIRECTION_KM
    );
  }

  // ─────────────────────────────────────────────
  // GET MY BOOKINGS
  // ─────────────────────────────────────────────

  async getMyBookings(parentId: number) {
    const bookings = await this.bookingRepo.findByParentId(parentId);

    return bookings.map((b) => {
      let daysRemaining: number | null = null;
      let balanceDueDate: Date | null = null;

      if (b.waitlist_started_at) {
        // 1. Calculate the actual Due Date (Started At + 15 days)
        const expiry = new Date(b.waitlist_started_at);
        expiry.setDate(expiry.getDate() + WAITLIST_DAYS);
        balanceDueDate = expiry;

        // 2. Calculate Days Remaining only if the status is still awaiting/pending
        if (b.status === 'awaiting_cluster' || b.status === 'deposit_pending') {
          const diff = expiry.getTime() - new Date().getTime();
          daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }
      }

      // const totalPrice = Number(b.total_price ?? 0);
      // const totalPaid = Number(b.total_paid ?? 0);
      // const balanceAmount = Math.max(0, totalPrice - totalPaid);

      return {
        id: b.id,
        service_type: b.service_type,
        term: b.term,
        trip_type: b.trip_type,
        children_count: b.children_count,
        days_left_to_pay: daysRemaining,
        balance_due_date: balanceDueDate,
        status: b.status,
        is_waitlisted: b.is_waitlisted,
        price_per_child: b.price_per_child,
        total_price: b.total_price,
        deposit_amount: b.deposit_amount,
        balance_amount: b.balance_amount,
        total_paid: b.total_paid,
        region: b.region,
        distance_km: b.distance_km,
        school: b.carpool_school?.name ?? b.bus_school?.name ?? null,
        pickup_station: b.pickup_station?.name ?? null,
        cluster_active: b.cluster?.is_active ?? false,
        cluster_count: b.cluster?.bookings?.length ?? null,
        children: b.children,
        created_at: b.created_at,
      };
    });
  }

  async getActiveBookingsForTerm(term: BookingTerm) {
    return this.bookingRepo.findByTermAndStatuses(term, [
      'deposit_paid',
      'completed',
    ]);
  }

  async getMyReceipts(parentId: number) {
    const receipts = await this.receiptRepo.findByParentId(parentId);

    return receipts.map((r) => ({
      id: r.id,
      reference: r.reference,
      name: r.name,
      term: r.term,
      amount: Number(r.amount),
      balance_remaining:
        r.balance_remaining !== null ? Number(r.balance_remaining) : null,
      payment_type: r.payment_type,
      service_type: r.service_type,
      school_name: r.school_name,
      home_location: r.home_location,
      children_count: r.children_count,
      payment_method: r.payment_method,
      mpesa_transaction_id: r.mpesa_transaction_id,
      paid_at: r.paid_at,
      booking_id: r.booking?.id ?? null,
    }));
  }

  async getReceiptByReference(parentId: number, reference: string) {
    const receipt = await this.receiptRepo.findByReference(reference);

    if (!receipt) throw new NotFoundException('Receipt not found');
    if (receipt.parent.id !== parentId)
      throw new BadRequestException('Unauthorized');

    const booking = receipt.booking;

    return {
      id: receipt.id,
      reference: receipt.reference,
      name: receipt.name,
      term: receipt.term,
      amount: Number(receipt.amount),
      balance_remaining:
        receipt.balance_remaining !== null
          ? Number(receipt.balance_remaining)
          : null,
      payment_type: receipt.payment_type,
      service_type: receipt.service_type,
      school_name: receipt.school_name,
      home_location: receipt.home_location,
      children_count: receipt.children_count,
      payment_method: receipt.payment_method,
      mpesa_transaction_id: receipt.mpesa_transaction_id,
      paid_at: receipt.paid_at,
      booking: {
        id: booking?.id ?? null,
        status: booking?.status ?? null,
        total_price: booking ? Number(booking.total_price) : null,
        total_paid: booking ? Number(booking.total_paid) : null,
      },
    };
  }

  async getPaymentHistory(parentId: number) {
    const [receipts, bookings] = await Promise.all([
      this.receiptRepo.findByParentId(parentId),
      this.bookingRepo.findByParentId(parentId),
    ]);

    // Build a map of booking totals for quick lookup
    const bookingMap = new Map(bookings.map((b) => [b.id, b]));

    return receipts.map((r) => {
      const booking = bookingMap.get(r.booking?.id);
      return {
        reference: r.reference,
        name: r.name,
        term: r.term,
        amount: Number(r.amount),
        balance_remaining:
          r.balance_remaining !== null ? Number(r.balance_remaining) : null,
        payment_type: r.payment_type,
        service_type: r.service_type,
        school_name: r.school_name,
        paid_at: r.paid_at,
        booking_status: booking?.status ?? null,
      };
    });
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  private async getCoordinates(
    placeName: string,
  ): Promise<{ lat: number; lon: number } | null> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        { params: { address: placeName, key: apiKey } },
      );
      const result = response.data?.results?.[0];
      if (!result) return null;
      const { lat, lng } = result.geometry.location;
      return { lat, lon: lng };
    } catch {
      return null;
    }
  }

  private haversineDistance(
    a: { lat: number; lon: number },
    b: { lat: number; lon: number },
  ): number {
    console.log(a);
    console.log(b);
    const R = 6371;
    const dLat = this.toRad(b.lat - a.lat);
    const dLon = this.toRad(b.lon - a.lon);
    const lat1 = this.toRad(a.lat);
    const lat2 = this.toRad(b.lat);
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

    const distance = R * 2 * Math.asin(Math.sqrt(x));
    console.log('Total distance: home to school', distance);
    return distance;
  }

  private async getRoadDistance(
    origin: { lat: number; lon: number },
    destination: { lat: number; lon: number },
  ): Promise<number | null> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) return null;

    try {
      const response = await axios.post(
        'https://routes.googleapis.com/directions/v2:computeRoutes',
        {
          origin: {
            location: {
              latLng: {
                latitude: origin.lat,
                longitude: origin.lon,
              },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: destination.lat,
                longitude: destination.lon,
              },
            },
          },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_UNAWARE',
        },
        {
          headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
              'routes.distanceMeters,routes.duration,routes.polyline',
          },
        },
      );

      // console.log(response);

      const route = response.data.routes?.[0];

      if (!route) return null;

      const distanceKm = route.distanceMeters / 1000;
      console.log(distanceKm);
      const billableDistance = Math.floor(distanceKm);
      console.log(billableDistance);

      return billableDistance;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  // private async getRoadDistance(
  //   origin: { lat: number; lon: number },
  //   destination: { lat: number; lon: number },
  // ): Promise<number | null> {
  //   const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  //   if (!apiKey) return null;

  //   try {
  //     const response = await axios.get(
  //       'https://maps.googleapis.com/maps/api/distancematrix/json',
  //       {
  //         params: {
  //           origins: `${origin.lat},${origin.lon}`,
  //           destinations: `${destination.lat},${destination.lon}`,
  //           key: apiKey,
  //         },
  //       },
  //     );

  //     console.log(JSON.stringify(response.data, null, 2));

  //     const element = response.data?.rows?.[0]?.elements?.[0];

  //     if (element?.status === 'OK') {
  //       // distance.value is in meters, convert to KM
  //       return element.distance.value / 1000;
  //     }

  //     console.warn(
  //       'Distance Matrix API returned non-OK status:',
  //       element?.status,
  //     );
  //     return null;
  //   } catch (error) {
  //     console.log(error);
  //     return null;
  //   }
  // }

  private toRad(deg: number) {
    return (deg * Math.PI) / 180;
  }

  private async getAccessToken(consumerKey: string, secretKey: string) {
    const now = Date.now();
    if (this.cachedToken && now < this.tokenExpiry) return this.cachedToken;

    const auth = Buffer.from(`${consumerKey}:${secretKey}`).toString('base64');
    const response = await axios.get(
      `${this.MPESA_BASEURL}/oauth/v3/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${auth}` } },
    );
    this.cachedToken = response.data.access_token;
    this.tokenExpiry = now + parseInt(response.data.expires_in) * 1000 - 60000;
    return this.cachedToken!;
  }

  private getTimestamp(): string {
    const d = new Date();
    return (
      d.getFullYear() +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0') +
      String(d.getHours()).padStart(2, '0') +
      String(d.getMinutes()).padStart(2, '0') +
      String(d.getSeconds()).padStart(2, '0')
    );
  }
}
