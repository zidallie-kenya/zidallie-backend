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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import { VehicleService } from './vehicles.service';
import { Vehicle } from './domain/vehicles';
import { RolesGuard } from '../roles/roles.guard';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { NullableType } from '../utils/types/nullable.type';
import { QueryVehicleDto } from './dto/vehicle-query.dto';
import { VehicleType } from '../utils/types/enums';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@ApiBearerAuth()
@ApiTags('Vehicles')
@Controller({
  path: 'vehicles',
  version: '1',
})
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Roles(RoleEnum.admin, RoleEnum.driver)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'vehicle_image_url_front', maxCount: 1 },
      { name: 'vehicle_image_url_back', maxCount: 1 },
      { name: 'vehicle_image_url_inside', maxCount: 1 },
      { name: 'insurance_certificate', maxCount: 1 },
      { name: 'logbook', maxCount: 1 },
      { name: 'vehicle_inspection_report', maxCount: 1 },
    ]),
  )
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createVehicleDto: CreateVehicleDto,
    @UploadedFiles()
    files: {
      vehicle_image_url_front?: Express.Multer.File[];
      vehicle_image_url_back?: Express.Multer.File[];
      vehicle_image_url_inside?: Express.Multer.File[];
      insurance_certificate?: Express.Multer.File[];
      logbook?: Express.Multer.File[];
      vehicle_inspection_report?: Express.Multer.File[];
    },
  ): Promise<Vehicle> {
    return this.vehicleService.create(createVehicleDto, files);
  }

  @ApiOkResponse({
    type: InfinityPaginationResponse(Vehicle),
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryVehicleDto,
  ): Promise<InfinityPaginationResponseDto<Vehicle>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.vehicleService.findManyWithPagination({
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

  @ApiOkResponse({
    type: Vehicle,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(@Param('id') id: Vehicle['id']): Promise<NullableType<Vehicle>> {
    return this.vehicleService.findById(id);
  }

  @ApiOkResponse({
    type: Vehicle,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('registration/:registrationNumber')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'registrationNumber',
    type: String,
    required: true,
  })
  findByRegistrationNumber(
    @Param('registrationNumber') registrationNumber: string,
  ): Promise<NullableType<Vehicle>> {
    return this.vehicleService.findByRegistrationNumber(registrationNumber);
  }

  @ApiOkResponse({
    type: [Vehicle],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'userId',
    type: Number,
    required: true,
  })
  findByUserId(@Param('userId') userId: number): Promise<Vehicle[]> {
    return this.vehicleService.findByUserId(userId);
  }

  @ApiOkResponse({
    type: [Vehicle],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('status/available')
  @HttpCode(HttpStatus.OK)
  findAvailableVehicles(): Promise<Vehicle[]> {
    return this.vehicleService.findAvailableVehicles();
  }

  @ApiOkResponse({
    type: [Vehicle],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('type/:vehicleType')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'vehicleType',
    type: String,
    required: true,
  })
  findByVehicleType(
    @Param('vehicleType') vehicleType: string,
  ): Promise<Vehicle[]> {
    return this.vehicleService.findByVehicleType(vehicleType as VehicleType);
  }

  @ApiOkResponse({
    type: [Vehicle],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('status/inspected')
  @HttpCode(HttpStatus.OK)
  findInspectedVehicles(): Promise<Vehicle[]> {
    return this.vehicleService.findInspectedVehicles();
  }

  @ApiOkResponse({
    type: [Vehicle],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('available-seats/:minSeats')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'minSeats',
    type: Number,
    required: true,
  })
  findVehiclesWithAvailableSeats(
    @Param('minSeats') minSeats: number,
  ): Promise<Vehicle[]> {
    return this.vehicleService.findVehiclesWithAvailableSeats(minSeats);
  }

  @ApiOkResponse({
    type: [Vehicle],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('search/model')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'term',
    type: String,
    required: true,
    description: 'Search term for vehicle model',
  })
  searchByModel(@Query('term') searchTerm: string): Promise<Vehicle[]> {
    return this.vehicleService.searchByModel(searchTerm);
  }

  @ApiOkResponse({
    type: Vehicle,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch(':id/available-seats')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  updateAvailableSeats(
    @Param('id') id: Vehicle['id'],
    @Body('availableSeats') availableSeats: number,
  ): Promise<Vehicle> {
    return this.vehicleService.updateAvailableSeats(id, availableSeats);
  }

  @ApiOkResponse({
    type: Vehicle,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: Vehicle['id'],
    @Body() updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle | null> {
    return this.vehicleService.update(id, updateVehicleDto);
  }

  @Roles(RoleEnum.admin, RoleEnum.driver, RoleEnum.user, RoleEnum.parent)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: Vehicle['id']): Promise<void> {
    return this.vehicleService.remove(id);
  }
}
