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
// Import the correct DTOs from query-dailyrides.dto instead of sorting.dto
import {
  FilterDailyRideDto,
  SortDailyRideDto,
} from './dto/query-dailyrides.dto';
// Import QueryDailyRideDto from sorting.dto for the API query parameter
import {
  InfinityPaginationResponseDto,
  QueryDailyRideDto,
} from './dto/sorting.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('DailyRides')
@Controller({ path: 'daily-rides', version: '1' })
export class DailyRidesController {
  constructor(private readonly dailyRidesService: DailyRidesService) {}

  @SerializeOptions({
    groups: ['admin'],
  })
  @Post()
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDailyRideDto: CreateDailyRideDto): Promise<DailyRide> {
    return this.dailyRidesService.create(createDailyRideDto);
  }

  @SerializeOptions({
    groups: ['admin'],
  })
  @Get()
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'rideId', required: false })
  @ApiQuery({ name: 'vehicleId', required: false })
  @ApiQuery({ name: 'driverId', required: false })
  @ApiQuery({ name: 'kind', required: false })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortDirection', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query() query: QueryDailyRideDto,
  ): Promise<InfinityPaginationResponseDto<DailyRide>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    // Transform the query parameters to match the service expectations
    const filterOptions: FilterDailyRideDto | null = query?.filters
      ? {
          ...query.filters,
          // Convert string date to Date object if present
          date: query.filters.date ? new Date(query.filters.date) : undefined,
        }
      : null;

    const sortOptions: SortDailyRideDto[] | null = query?.sort
      ? query.sort.map((sortItem) => ({
          orderBy: sortItem.orderBy || 'id', // Provide default value
          order: sortItem.order || 'ASC',
        }))
      : null;

    const items = await this.dailyRidesService.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions: {
        page,
        limit,
      },
    });

    return new InfinityPaginationResponseDto({
      items,
      page,
      limit,
      hasMore: items.length === limit,
    });
  }

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

  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('by-driver/:driverId')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'driverId', type: 'number' })
  findByDriverId(
    @Param('driverId', ParseIntPipe) driverId: number,
  ): Promise<DailyRide[]> {
    return this.dailyRidesService.findByDriverId(driverId);
  }

  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('by-parent/:parentId')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'parentId', type: 'number' })
  findByParentId(
    @Param('parentId', ParseIntPipe) parentId: number,
  ): Promise<DailyRide[]> {
    return this.dailyRidesService.findByParentId(parentId);
  }

  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('by-date-range')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'startDate', type: 'string', format: 'date' })
  @ApiQuery({ name: 'endDate', type: 'string', format: 'date' })
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<DailyRide[]> {
    return this.dailyRidesService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

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

  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch(':id/start')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: 'number' })
  startDailyRide(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DailyRide | null> {
    return this.dailyRidesService.startDailyRide(id);
  }

  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch(':id/complete')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: 'number' })
  completeDailyRide(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DailyRide | null> {
    return this.dailyRidesService.completeDailyRide(id);
  }

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

  @Delete(':id')
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: 'number' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.dailyRidesService.remove(id);
  }
}
