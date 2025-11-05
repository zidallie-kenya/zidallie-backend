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
} from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { NullableType } from '../utils/types/nullable.type';
import { Location } from './domain/location';
import { infinityPagination } from '../utils/infinity-pagination';
import { LocationsService } from './location.service';
import { QueryLocationDto } from './dto/query-location.dto';

@ApiBearerAuth()
@Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Locations')
@Controller({
  path: 'locations',
  version: '1',
})
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  //creates a new location
  @ApiCreatedResponse({
    type: Location,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Post()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any): Promise<Location> {
    // Manually construct the DTO-like object
    const payload = {
      ...body,
      driverId: Number(body.driverId),
      latitude: body.latitude,
      longitude: body.longitude,
      timestamp: body.timestamp,
    };

    return this.locationsService.create(payload);
  }

  //returns all the location data with a limit of 50
  @ApiOkResponse({
    type: InfinityPaginationResponse(Location),
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryLocationDto,
  ): Promise<InfinityPaginationResponseDto<Location>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.locationsService.findManyWithPagination({
        filterOptions: query?.filters,
        sortOptions: query?.sort,
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  //get one specific location using id
  @ApiOkResponse({
    type: Location,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(@Param('id') id: Location['id']): Promise<NullableType<Location>> {
    return this.locationsService.findById(id);
  }

  // to update location data
  @ApiOkResponse({
    type: Location,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: Location['id'],
    @Body() updateLocationDto: UpdateLocationDto,
  ): Promise<Location | null> {
    return this.locationsService.update(id, updateLocationDto);
  }

  // delete location data
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: Location['id']): Promise<void> {
    return this.locationsService.remove(id);
  }

  //get location data of a daily ride
  @ApiOkResponse({
    type: [Location],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('daily-ride/:dailyRideId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'dailyRideId',
    type: String,
    required: true,
  })

  //get location data for a specific driver
  @ApiOkResponse({
    type: [Location],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('driver/:driverId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'driverId',
    type: String,
    required: true,
  })
  findByDriverId(
    @Param('driverId') driverId: Location['driver']['id'],
  ): Promise<Location[]> {
    return this.locationsService.findByDriverId(driverId);
  }

  // get location data in a certain time range
  @ApiOkResponse({
    type: [Location],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('time-range')
  @HttpCode(HttpStatus.OK)
  findByTimeRange(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ): Promise<Location[]> {
    return this.locationsService.findByTimeRange(
      new Date(startTime),
      new Date(endTime),
    );
  }

  //get the latest location data for a driver
  @ApiOkResponse({
    type: Location,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get('driver/:driverId/latest')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'driverId',
    type: String,
    required: true,
  })
  findLatestByDriverId(
    @Param('driverId') driverId: Location['driver']['id'],
  ): Promise<NullableType<Location>> {
    return this.locationsService.findLatestByDriverId(driverId);
  }
}
