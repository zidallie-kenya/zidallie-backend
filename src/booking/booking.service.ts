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
import { BookingEntity } from './infrastructure/persistence/relational/entities/booking.entity';
import { BookingDepositEntity } from './infrastructure/persistence/relational/entities/booking-deposit.entity';
import { ClusterEntity } from './infrastructure/persistence/relational/entities/cluster.entity';
import { UsersService } from '../users/users.service';

const DEPOSIT_PER_CHILD = 3000;
const CLUSTER_MIN = 3;
const CLUSTER_RADIUS_KM = 2.0;
const SCHOOL_DIRECTION_KM = 5.0;
const WAITLIST_DAYS = 15;

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
  ) {}

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

  async createBooking(parentId: number, dto: CreateBookingDto) {
    let region: string | null = null;
    let distanceKm: number | null = null;
    let pricePerChild: number | null = null;

    const user = await this.usersService.findById(parentId);
    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'A parent with this id does not exist',
        },
      });
    }

    if (dto.service_type === 'carpool') {
      if (
        !dto.carpool_school_id ||
        dto.home_lat == null ||
        dto.home_lon == null
      ) {
        throw new BadRequestException(
          'Carpool requires carpool_school_id, home_lat, and home_lon',
        );
      }

      const school = await this.carpoolSchoolRepo.findById(
        dto.carpool_school_id,
      );
      if (!school) throw new NotFoundException('Carpool school not found');

      region = school.region;

      // Get school coordinates via Google Maps
      const schoolCoords = await this.getCoordinates(
        school.name + ', Nairobi, Kenya',
      );
      if (!schoolCoords) {
        throw new BadRequestException(
          'Could not locate the school. Please try again.',
        );
      }

      distanceKm = this.haversineDistance(
        { lat: Number(dto.home_lat), lon: Number(dto.home_lon) },
        schoolCoords,
      );

      pricePerChild = await this.pricingRepo.getPrice(
        region,
        distanceKm,
        'carpool',
      );
      if (!pricePerChild) {
        throw new BadRequestException(
          'The distance is out of our service range for your area.',
        );
      }

      // Apply 70% for one-way
      if (dto.trip_type === 'one_way') {
        pricePerChild = Math.round(pricePerChild * 0.7);
      }
    } else {
      // Bus
      if (!dto.bus_school_id || !dto.pickup_station_id) {
        throw new BadRequestException(
          'Bus service requires bus_school_id and pickup_station_id',
        );
      }

      const [busSchool, pickupStation] = await Promise.all([
        this.busSchoolRepo.findById(dto.bus_school_id),
        this.pickupStationRepo.findById(dto.pickup_station_id),
      ]);

      if (!busSchool) throw new NotFoundException('Bus school not found');
      if (!pickupStation)
        throw new NotFoundException('Pickup station not found');

      region = busSchool.region;

      const [pickupCoords, schoolCoords] = await Promise.all([
        this.getCoordinates(pickupStation.name + ', Nairobi, Kenya'),
        this.getCoordinates(busSchool.name + ', Nairobi, Kenya'),
      ]);

      if (!pickupCoords || !schoolCoords) {
        throw new BadRequestException(
          'Could not calculate distance. Please try again.',
        );
      }

      distanceKm = this.haversineDistance(pickupCoords, schoolCoords);
      pricePerChild = await this.pricingRepo.getPrice(
        region,
        distanceKm,
        'bus',
      );

      if (!pricePerChild) {
        throw new BadRequestException(
          'The distance is out of our service range for your area.',
        );
      }

      if (dto.trip_type === 'one_way') {
        pricePerChild = Math.round(pricePerChild * 0.7);
      }
    }

    const totalPrice = pricePerChild * dto.children_count;
    const depositAmount = DEPOSIT_PER_CHILD * dto.children_count;
    const balanceAmount = totalPrice - depositAmount;

    const booking = await this.bookingRepo.create({
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
      balance_amount: balanceAmount,
      is_waitlisted: true,
      status: 'pending',
    });

    return {
      booking_id: booking.id,
      service_type: booking.service_type,
      term: booking.term,
      trip_type: booking.trip_type,
      children_count: booking.children_count,
      region,
      distance_km: distanceKm,
      price_per_child: pricePerChild,
      total_price: totalPrice,
      deposit_amount: depositAmount,
      balance_amount: balanceAmount,
      home: booking.home_area || null,
      bus_pickup: booking.pickup_station || null,
      school: booking.bus_school || booking.carpool_school,
    };
  }

  // ─────────────────────────────────────────────
  // STEP 2: SUBMIT CHILD DETAILS
  // ─────────────────────────────────────────────

  async submitChildren(
    parentId: number,
    bookingId: number,
    dto: SubmitChildrenDto,
  ) {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.parent.id !== parentId)
      throw new BadRequestException(
        'The provided parent id doesnt match the booking parent',
      );

    if (dto.children.length !== booking.children_count) {
      throw new BadRequestException(
        `Expected ${booking.children_count} child(ren), got ${dto.children.length}`,
      );
    }

    // Replace children
    booking.children = dto.children.map(
      (c) =>
        ({
          name: c.name,
          grade_class: c.grade_class ?? null,
          pickup_time: c.pickup_time ?? null,
          dropoff_time: c.dropoff_time ?? null,
          emergency_contact: c.emergency_contact,
          emergency_contact_phone: c.emergency_contact_phone,
          emergency_contact_email: c.emergency_contact_email ?? null,
          booking,
        }) as any,
    );

    booking.status = 'awaiting_cluster';
    booking.is_waitlisted = true;
    booking.waitlist_started_at = new Date(); // Start the 15-day clock

    await this.bookingRepo.save(booking);

    const data = {
      booking_id: bookingId,
      service: booking.service_type,
      term_booked: booking.term,
      school: booking.carpool_school || booking.bus_school,
      home_pickup: booking.home_area,
      bus_pickup_station: booking.pickup_station,
      children: booking.children_count,
      deposit_per_child: booking.deposit_amount,
      deposit_total_amount:
        (booking.deposit_amount || 3000) * booking.children_count,
      total_amount: booking.total_price,
    };
    return { message: 'Children details saved', data };
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
        // Auto-cancel if they try to pay after the window
        booking.status = 'cancelled';
        await this.bookingRepo.save(booking);
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

  // ─────────────────────────────────────────────
  // STEP 4: M-PESA CALLBACK → CLUSTER LOGIC
  // ─────────────────────────────────────────────

  async handleDepositCallback(receivedData: any) {
    const stkCallback = receivedData?.Body?.stkCallback;
    if (!stkCallback) {
      console.log('Received invalid M-Pesa callback.');
      return { ResultCode: 0, ResultDesc: 'Accepted' };
    }

    if (stkCallback.ResultCode !== 0) {
      console.log(`Deposit payment failed: ${stkCallback.ResultDesc}`);
      // Mark deposit as failed
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

    console.log(
      `Deposit Amount received: ${amount} from phone number: ${mpesaTransactionId} for CheckoutRequestID: ${checkoutId}`,
    );

    try {
      await this.dataSource.transaction(async (manager) => {
        const depositRepo = manager.getRepository(BookingDepositEntity);

        const deposit = await depositRepo.findOne({
          where: { checkout_request_id: checkoutId },
          relations: ['booking', 'booking.parent', 'booking.carpool_school'],
          lock: { mode: 'pessimistic_write' },
        });

        if (!deposit) {
          console.log(`No deposit found for checkout: ${checkoutId}`);
          return;
        }

        if (deposit.status === 'paid') {
          console.log(`Duplicate callback for: ${checkoutId}`);
          return;
        }

        // Mark deposit paid
        deposit.status = 'paid';
        deposit.mpesa_transaction_id = mpesaTransactionId;
        await manager.save(deposit);

        // Update booking total_paid
        const bookingRepo = manager.getRepository(BookingEntity);
        const booking = await bookingRepo.findOne({
          where: { id: deposit.booking.id },
          relations: ['cluster', 'carpool_school'],
          lock: { mode: 'pessimistic_write' },
        });

        if (!booking) return;

        booking.total_paid = Number(booking.total_paid) + Number(amount);

        // If fully paid, mark accordingly
        if (booking.total_paid >= Number(booking.total_price)) {
          booking.status = 'completed';
        } else {
          booking.status = 'deposit_paid';
        }

        await manager.save(booking);
      });

      // Run cluster logic OUTSIDE transaction (reads other bookings)
      const deposit = await this.depositRepo.findByCheckoutId(checkoutId);
      if (deposit) {
        await this.runClusterLogic(deposit.booking.id);
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

    // Only carpool needs clustering
    if (booking.service_type !== 'carpool') {
      booking.is_waitlisted = false;
      await this.bookingRepo.save(booking);
      return;
    }

    const cluster = await this.findOrCreateCluster(booking);
    booking.cluster = cluster;
    await this.bookingRepo.save(booking);

    // REFRESH cluster to get all current bookings
    const updatedCluster = await this.clusterRepo.findById(cluster.id);

    // MATCH Calculate total children in the cluster
    let totalStudents = 0;
    if (updatedCluster !== null) {
      totalStudents = updatedCluster.bookings.reduce(
        (sum, b) => sum + Number(b.children_count),
        0,
      );
    }

    if (totalStudents >= CLUSTER_MIN) {
      cluster.is_active = true;
      await this.clusterRepo.save(cluster);

      // Mark all members confirmed
      for (const b of cluster.bookings) {
        b.is_waitlisted = false;
        await this.bookingRepo.save(b);
      }
    } else {
      booking.is_waitlisted = true;
      await this.clusterRepo.save(cluster);

      booking.is_waitlisted = true;
      booking.status = 'awaiting_cluster';
      await this.bookingRepo.save(booking);
    }
  }

  private async findOrCreateCluster(
    booking: BookingEntity,
  ): Promise<ClusterEntity> {
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

    // 1. Search existing clusters for this term
    const clusters = await this.clusterRepo.findByTerm(booking.term);

    for (const cluster of clusters) {
      if ((cluster.bookings?.length ?? 0) >= cluster.max_capacity) continue;

      const anchor = cluster.bookings?.[0];
      if (!anchor) continue;

      const anchorCoords = {
        lat: Number(anchor.home_lat),
        lon: Number(anchor.home_lon),
      };

      // haversine_distance <= 2.0
      const proximityOk =
        this.haversineDistance(newCoords, anchorCoords) <= CLUSTER_RADIUS_KM;
      if (!proximityOk) continue;

      // Check school direction (only if carpool schools differ)
      const sameDirectionOk = await this.isInSameDirection(booking, anchor);
      if (sameDirectionOk) {
        return cluster;
      }
    }

    // No suitable cluster — create new one
    return this.clusterRepo.create({
      term: booking.term,
      zone: booking.region ?? 'General',
      is_active: false,
    });
  }

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
    const R = 6371;
    const dLat = this.toRad(b.lat - a.lat);
    const dLon = this.toRad(b.lon - a.lon);
    const lat1 = this.toRad(a.lat);
    const lat2 = this.toRad(b.lat);
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(x));
  }

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
