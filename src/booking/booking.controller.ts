import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SubmitChildrenDto } from './dto/submit-children.dto';
import { InitiateDepositDto } from './dto/initiate-deposit.dto';
import { TransportBookingService } from './booking.service';
import { UpdateNotificationSettingsDto } from '../users/dto/update-notification-settings.dto';

@ApiTags('Transport Bookings')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'transport-bookings', version: '1' })
export class TransportBookingController {
  constructor(private readonly service: TransportBookingService) {}

  // ── Reference data (no auth needed) ──────────────────────
  @Get('carpool-schools')
  @Public()
  getCarpoolSchools() {
    return this.service.getCarpoolSchools();
  }

  @Get('carpool-schools/search/:term')
  @Public()
  searchCarpoolSchools(@Param('term') term: string) {
    return this.service.searchCarpoolSchools(term);
  }

  @Get('bus-schools')
  @Public()
  getBusSchools() {
    return this.service.getBusSchools();
  }

  @Get('bus-schools/by-pickup/:pickupStationId')
  @Public()
  getBusSchoolsByPickup(
    @Param('pickupStationId', ParseIntPipe) pickupStationId: number,
  ) {
    return this.service.getBusSchoolsByPickupStation(pickupStationId);
  }

  @Get('pickup-stations')
  @Public()
  getPickupStations() {
    return this.service.getPickupStations();
  }

  // ── Booking flow (parent auth required) ──────────────────
  @Post()
  @Roles(RoleEnum.parent)
  createBooking(@Req() req: any, @Body() dto: CreateBookingDto) {
    return this.service.createBooking(req.user.id, dto);
  }

  @Post(':bookingId/children')
  @Roles(RoleEnum.parent)
  submitChildren(
    @Req() req: any,
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @Body() dto: SubmitChildrenDto,
  ) {
    return this.service.submitChildren(req.user.id, bookingId, dto);
  }

  @Post(':bookingId/deposit')
  @Roles(RoleEnum.parent)
  initiateDeposit(
    @Req() req: any,
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @Body() dto: InitiateDepositDto,
  ) {
    return this.service.initiateDeposit(req.user.id, bookingId, dto);
  }

  @Get('my')
  @Roles(RoleEnum.parent)
  getMyBookings(@Req() req: any) {
    return this.service.getMyBookings(req.user.id);
  }

  // ── M-Pesa callback (public) ───────────────────────────
  @Post('deposit-callback')
  @Public()
  depositCallback(@Req() req: Request) {
    return this.service.handleDepositCallback(req.body);
  }

  //My students
  @Get('my-students')
  @Roles(RoleEnum.parent)
  @SerializeOptions({
    groups: ['me'],
  })
  getMyStudents(@Req() req: any) {
    return this.service.getMyStudents(req.user.id);
  }

  //all previous addresses
  @Get('my-addresses')
  @Roles(RoleEnum.parent)
  getSavedAddresses(@Req() req: any) {
    return this.service.getSavedAddresses(req.user.id);
  }

  @Get('my-receipts')
  @Roles(RoleEnum.parent)
  getMyReceipts(@Req() req: any) {
    return this.service.getMyReceipts(req.user.id);
  }

  @Get('my-receipts/:reference')
  @Roles(RoleEnum.parent)
  getReceiptByReference(
    @Req() req: any,
    @Param('reference') reference: string,
  ) {
    return this.service.getReceiptByReference(req.user.id, reference);
  }

  @Get('my-payment-history')
  @Roles(RoleEnum.parent)
  getPaymentHistory(@Req() req: any) {
    return this.service.getPaymentHistory(req.user.id);
  }

  @Get('my-notifications')
  @Roles(RoleEnum.parent)
  getMyNotifications(@Req() req: any) {
    return this.service.getMyNotifications(req.user.id);
  }

  @Get('my-notification-settings')
  @Roles(RoleEnum.parent)
  getNotificationSettings(@Req() req: any) {
    return this.service.getNotificationSettings(req.user.id);
  }

  @Patch('my-notification-settings')
  @Roles(RoleEnum.parent)
  updateNotificationSettings(
    @Req() req: any,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    return this.service.updateNotificationSettings(req.user.id, dto);
  }
}
