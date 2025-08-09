import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DailyRidesService } from './daily_rides.service';
import { CreateDailyRideDto } from './dto/create-daily_ride.dto';
import { UpdateDailyRideDto } from './dto/update-daily_ride.dto';

@Controller('daily-rides')
export class DailyRidesController {
  constructor(private readonly dailyRidesService: DailyRidesService) {}

  @Post()
  create(@Body() createDailyRideDto: CreateDailyRideDto) {
    return this.dailyRidesService.create(createDailyRideDto);
  }

  @Get()
  findAll() {
    return this.dailyRidesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dailyRidesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDailyRideDto: UpdateDailyRideDto,
  ) {
    return this.dailyRidesService.update(+id, updateDailyRideDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dailyRidesService.remove(+id);
  }
}
