import { Injectable } from '@nestjs/common';
import { CreateDailyRideDto } from './dto/create-daily_ride.dto';
import { UpdateDailyRideDto } from './dto/update-daily_ride.dto';

@Injectable()
export class DailyRidesService {
  create(createDailyRideDto: CreateDailyRideDto) {
    return 'This action adds a new dailyRide';
  }

  findAll() {
    return `This action returns all dailyRides`;
  }

  findOne(id: number) {
    return `This action returns a #${id} dailyRide`;
  }

  update(id: number, updateDailyRideDto: UpdateDailyRideDto) {
    return `This action updates a #${id} dailyRide`;
  }

  remove(id: number) {
    return `This action removes a #${id} dailyRide`;
  }
}
