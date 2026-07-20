import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NavigationService {
  async getRoadDistance(
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number,
  ): Promise<number> {
    try {
      // OSRM uses {longitude},{latitude} format
      const url = `http://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=false`;

      const response = await axios.get(url);

      if (response.data.routes && response.data.routes.length > 0) {
        // Distance is returned in meters, convert to KM
        const distanceMeters = response.data.routes[0].distance;
        const distance_km = distanceMeters / 1000;
        console.log('Distance in kilometer', distance_km);
        return distance_km;
      }

      throw new Error('No route found');
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Failed to calculate road distance',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
