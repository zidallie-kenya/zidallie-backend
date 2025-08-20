import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  SerializeOptions,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { DailyRide } from './domain/daily_rides';
import { DailyRideStatus } from '../utils/types/enums';
import { NullableType } from '../utils/types/nullable.type';
import { UpdateDailyRideDto } from './dto/update-daily_ride.dto';
import { CreateDailyRideDto } from './dto/create-daily_ride.dto';
import { DailyRidesService } from './daily_rides.service';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { MyRidesResponseDto } from './dto/response.dto';

const parseDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('-').map(Number);
  if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) {
    throw new BadRequestException({
      status: HttpStatus.BAD_REQUEST,
      errors: { date: `Invalid date format: ${dateStr}. Use DD-MM-YYYY.` },
    });
  }
  const date = new Date(year, month - 1, day); // Month is 0-based in JavaScript
  if (isNaN(date.getTime())) {
    throw new BadRequestException({
      status: HttpStatus.BAD_REQUEST,
      errors: { date: `Invalid date: ${dateStr}` },
    });
  }
  return date;
};

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('DailyRides')
@Controller({ path: 'daily-rides', version: '1' })
export class DailyRidesController {
  constructor(private readonly dailyRidesService: DailyRidesService) {}

  //create the daily ride
  @SerializeOptions({
    groups: ['admin'],
  })
  @Post()
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDailyRideDto: CreateDailyRideDto): Promise<DailyRide> {
    return this.dailyRidesService.create(createDailyRideDto);
  }

  //returns all the upcoming dailys
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('upcoming')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days ahead to fetch (default: 7)',
  })
  findUpcoming(
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
  ): Promise<DailyRide[]> {
    return this.dailyRidesService.findUpcomingDailyRides(days);
  }

  // returns daily-rides by status
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('by-status/:status')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'status', enum: DailyRideStatus })
  findByStatus(@Param('status') status: DailyRideStatus): Promise<DailyRide[]> {
    return this.dailyRidesService.findDailyRidesByStatus(status);
  }

  // returns a specific daily ride
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('by-ride/:rideId')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'rideId', type: 'number' })
  findByRideId(
    @Param('rideId', ParseIntPipe) rideId: number,
  ): Promise<DailyRide[]> {
    return this.dailyRidesService.findByRideId(rideId);
  }

  // returns daily rides by-date-range
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('by-date-range')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'startDate',
    type: 'string',
    format: 'date',
    description: 'Start date in DD-MM-YYYY format (e.g., 26-08-2025)',
  })
  @ApiQuery({
    name: 'endDate',
    type: 'string',
    format: 'date',
    description: 'End date in DD-MM-YYYY format (e.g., 26-09-2025)',
  })
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<DailyRide[]> {
    try {
      const start = parseDate(startDate);
      const end = parseDate(endDate);
      return this.dailyRidesService.findByDateRange(start, end);
    } catch (error) {
      console.log(error);

      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: { date: 'Failed to parse dates. Ensure format is DD-MM-YYYY.' },
      });
    }
  }

  //returns a driver's and parent's rides
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('my-rides')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by ride status',
    enum: DailyRideStatus,
  })
  getMyRides(
    @Req() req: any,
    @Query('status') status?: DailyRideStatus,
  ): Promise<MyRidesResponseDto[]> {
    const userJwtPayload: JwtPayloadType = req.user;
    return this.dailyRidesService.findMyDailyRides(userJwtPayload, status);
  }

  // driver starts all today's ride [marks all todays rides as Started]
  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch('start-day')
  @Roles(RoleEnum.admin, RoleEnum.driver)
  @HttpCode(HttpStatus.OK)
  startDay(@Req() req: any): Promise<{
    message: string;
    updatedRides: DailyRide[];
    driverStartTime: Date;
  }> {
    const userJwtPayload: JwtPayloadType = req.user;
    return this.dailyRidesService.startDriverDay(userJwtPayload);
  }

  // changes a student's daily ride status to Active
  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch(':id/embark')
  @Roles(RoleEnum.admin, RoleEnum.driver)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: 'number' })
  embarkStudent(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DailyRide | null> {
    return this.dailyRidesService.embarkStudent(id);
  }

  // changes the student's daily ride status to Finished
  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch(':id/disembark')
  @Roles(RoleEnum.admin, RoleEnum.driver)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: 'number' })
  disembarkStudent(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DailyRide | null> {
    return this.dailyRidesService.disembarkStudent(id);
  }

  //gets a specific dairy ride
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get(':id')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: 'number' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<NullableType<DailyRide>> {
    return this.dailyRidesService.findById(id);
  }

  // updates a daily ride
  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch(':id')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: 'number' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDailyRideDto: UpdateDailyRideDto,
  ): Promise<DailyRide | null> {
    return this.dailyRidesService.update(id, updateDailyRideDto);
  }

  //marks a ride as Finished since it was cancelled
  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch(':id/cancel')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: 'number' })
  cancelDailyRide(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ): Promise<DailyRide | null> {
    return this.dailyRidesService.cancelDailyRide(id, reason);
  }

  // delete a daily ride
  @Delete(':id')
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: 'number' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.dailyRidesService.remove(id);
  }
}
