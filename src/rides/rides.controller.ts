import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  SerializeOptions,
  ParseIntPipe,
} from '@nestjs/common';
import { CreateRideDto } from './dto/create-ride.dto';
import { UpdateRideDto } from './dto/update-ride.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { NullableType } from '../utils/types/nullable.type';
import { Ride } from './domain/rides';
import { RidesService } from './rides.service';
import { RolesGuard } from '../roles/roles.guard';
import { infinityPagination } from '../utils/infinity-pagination';
import { RideStatus } from '../utils/types/enums';
import { QueryRideDto } from './dto/filter-query.dto';
import { SortRideDto } from './dto/query-ride.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Rides')
@Controller({
  path: 'rides',
  version: '1',
})
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @ApiCreatedResponse({
    type: Ride,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Post()
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createRideDto: CreateRideDto,
  ): Promise<{ ride: Ride; ride_id: number }> {
    return this.ridesService.create(createRideDto);
  }

  @ApiOkResponse({
    type: InfinityPaginationResponse(Ride),
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get()
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'vehicleId', required: false })
  @ApiQuery({ name: 'driverId', required: false })
  @ApiQuery({ name: 'schoolId', required: false })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiQuery({ name: 'parentId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortDirection', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query() query: QueryRideDto,
  ): Promise<InfinityPaginationResponseDto<Ride>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }
    const mappedSortOptions: SortRideDto[] | null =
      query?.sort?.filter(
        (sort): sort is SortRideDto =>
          typeof sort.orderBy === 'string' && typeof sort.order === 'string',
      ) ?? null;

    return infinityPagination(
      await this.ridesService.findManyWithPagination({
        filterOptions: query?.filters,
        sortOptions: mappedSortOptions,
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @ApiOkResponse({
    type: [Ride],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('by-status/:status')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'status', enum: RideStatus })
  async findByStatus(@Param('status') status: RideStatus): Promise<Ride[]> {
    return this.ridesService.findRidesByStatus(status);
  }

  @ApiOkResponse({
    type: [Ride],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('by-student/:studentId')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'studentId', type: 'number' })
  async findByStudentId(
    @Param('studentId', ParseIntPipe) studentId: number,
  ): Promise<Ride[]> {
    return this.ridesService.findByStudentId(studentId);
  }

  @ApiOkResponse({
    type: [Ride],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('by-parent/:parentId')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'parentId', type: 'number' })
  async findByParentId(
    @Param('parentId', ParseIntPipe) parentId: number,
  ): Promise<Ride[]> {
    return this.ridesService.findByParentId(parentId);
  }

  @ApiOkResponse({
    type: [Ride],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('by-driver/:driverId')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'driverId', type: 'number' })
  async findByDriverId(
    @Param('driverId', ParseIntPipe) driverId: number,
  ): Promise<Ride[]> {
    return this.ridesService.findByDriverId(driverId);
  }

  @ApiOkResponse({
    type: [Ride],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('recent-by-driver/:driverId')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'driverId', type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  async findRecentByDriverId(
    @Param('driverId', ParseIntPipe) driverId: number,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ): Promise<Ride[]> {
    return this.ridesService.findRecentByDriverId(driverId, limit);
  }

  @ApiOkResponse({
    type: Ride,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get(':id')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: 'number',
    required: true,
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<NullableType<Ride>> {
    return this.ridesService.findById(id);
  }

  @ApiOkResponse({
    type: Ride,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch(':id')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: 'number',
    required: true,
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRideDto: UpdateRideDto,
  ): Promise<Ride | null> {
    return this.ridesService.update(id, updateRideDto);
  }

  @ApiOkResponse({
    type: Ride,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch(':id/approve')
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: 'number' })
  async approveRide(
    @Param('id', ParseIntPipe) id: number,
    @Body('adminComments') adminComments?: string,
  ): Promise<Ride | null> {
    return this.ridesService.approveRide(id, adminComments);
  }

  @ApiOkResponse({
    type: Ride,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch(':id/reject')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: 'number' })
  async rejectRide(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ): Promise<Ride | null> {
    return this.ridesService.rejectRide(id, reason);
  }

  @ApiOkResponse({
    type: Ride,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch(':id/cancel')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: 'number' })
  async cancelRide(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ): Promise<Ride | null> {
    return this.ridesService.cancelRide(id, reason);
  }

  @ApiOkResponse({
    type: Ride,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch(':id/activate')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: 'number' })
  async activateRide(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Ride | null> {
    return this.ridesService.activateRide(id);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @ApiParam({
    name: 'id',
    type: 'number',
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.ridesService.remove(id);
  }
}
