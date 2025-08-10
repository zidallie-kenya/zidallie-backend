/*
This service manages socket rooms for rides and drivers, allowing parents to join rides and track their children in real-time.
*/
import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

const REDIS_TTL = {
  PARENT_SOCKET: 86400, // 24 hours
  LOCATION_CACHE: 3600, // 1 hour
} as const;

@Injectable()
export class SocketRoomService {
  private readonly logger = new Logger(SocketRoomService.name);

  // constructor(@InjectRedis() private readonly redis: Redis) {}
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  // Adds a parent socket to a ride, allowing them to track their child in real-time
  async addParentToRide(rideId: string, socketId: string): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      pipeline.sadd(`ride:${rideId}:sockets`, socketId); // Add to ride
      pipeline.sadd('allRideSockets', `ride:${rideId}:sockets`); // Index it
      await pipeline.exec();
    } catch (error) {
      this.logger.error(`Failed to add parent to ride ${rideId}:`, error);
      throw error;
    }
  }

  // Removes a parent socket from a ride
  async removeParentFromRide(rideId: string, socketId: string): Promise<void> {
    try {
      await this.redis.srem(`ride:${rideId}:sockets`, socketId);
    } catch (error) {
      this.logger.error(`Failed to remove parent from ride ${rideId}:`, error);
    }
  }

  // Retrieves all parent sockets in a specific ride
  async mapChildToParentSocket(
    childId: string,
    socketId: string,
  ): Promise<void> {
    try {
      await this.redis.set(
        `child:${childId}:parentSocket`,
        socketId,
        'EX', // Expiration flag
        REDIS_TTL.PARENT_SOCKET, // 24 hours
      );
    } catch (error) {
      this.logger.error(`Failed to map child ${childId} to socket:`, error);
      throw error;
    }
  }

  // Retrieves the parent socket for a specific child
  async getParentSocketForChild(childId: string): Promise<string | null> {
    try {
      return await this.redis.get(`child:${childId}:parentSocket`);
    } catch (error) {
      this.logger.error(
        `Failed to get parent socket for child ${childId}:`,
        error,
      );
      return null;
    }
  }

  // Removes the child-to-parent socket mapping
  async removeChildToParentMapping(childId: string): Promise<void> {
    try {
      await this.redis.del(`child:${childId}:parentSocket`);
    } catch (error) {
      this.logger.error(
        `Failed to remove child ${childId} to parent mapping:`,
        error,
      );
    }
  }

  // Adds a parent socket to a driver's room, allowing them to receive updates about the driver
  async addParentToDriverRoom(
    driverId: string,
    socketId: string,
  ): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      pipeline.sadd(`driver:${driverId}:sockets`, socketId);
      pipeline.sadd('allDriverRooms', `driver:${driverId}:sockets`);
      await pipeline.exec();
    } catch (error) {
      this.logger.error(
        `Failed to add parent to driver ${driverId} room:`,
        error,
      );
      throw error;
    }
  }

  // Removes a parent socket from a driver's room
  async removeParentFromDriverRoom(
    driverId: string,
    socketId: string,
  ): Promise<void> {
    try {
      await this.redis.srem(`driver:${driverId}:sockets`, socketId);
    } catch (error) {
      this.logger.error(
        `Failed to remove parent from driver ${driverId} room:`,
        error,
      );
    }
  }

  // Retrieves all parent sockets in a driver's room
  async getAllParentsInDriverRoom(driverId: string): Promise<string[]> {
    try {
      return await this.redis.smembers(`driver:${driverId}:sockets`);
    } catch (error) {
      this.logger.error(
        `Failed to get parents in driver ${driverId} room:`,
        error,
      );
      return [];
    }
  }

  // Retrieves all parent sockets in a specific ride
  async getAllParentsInRide(rideId: string): Promise<string[]> {
    try {
      return await this.redis.smembers(`ride:${rideId}:sockets`);
    } catch (error) {
      this.logger.error(`Failed to get parents in ride ${rideId}:`, error);
      return [];
    }
  }

  // Cleans up a driver's room when they disconnect or are no longer active
  async cleanupDriverRoom(driverId: string): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      pipeline.del(`driver:${driverId}:sockets`);
      pipeline.srem('allDriverRooms', `driver:${driverId}:sockets`);
      await pipeline.exec();
    } catch (error) {
      this.logger.error(`Failed to cleanup driver ${driverId} room:`, error);
    }
  }

  // Cleans up a disconnected socket from all rooms and mappings
  async cleanupDisconnectedSocket(socketId: string): Promise<void> {
    try {
      // Get all possible Redis keys that might contain this socket
      const driverRoomKeys = await this.redis.smembers('allDriverRooms');
      const rideSocketKeys = await this.redis.smembers('allRideSockets');

      const pipeline = this.redis.pipeline();

      // Remove from all driver rooms
      for (const roomKey of driverRoomKeys) {
        pipeline.srem(roomKey, socketId);
      }

      // Remove from all ride socket sets
      for (const socketKey of rideSocketKeys) {
        pipeline.srem(socketKey, socketId);
      }

      await pipeline.exec();

      // Clean up child-to-parent mappings : we need to scan for keys
      //let ttl handle this automatically
      //   const childKeys = await this.redis.keys('child:*:parentSocket');
      //   const cleanupPipeline = this.redis.pipeline();

      //   for (const childKey of childKeys) {
      //     const parentSocket = await this.redis.get(childKey);
      //     if (parentSocket === socketId) {
      //       cleanupPipeline.del(childKey);
      //     }
      //   }

      //   if (cleanupPipeline.length > 0) {
      //     await cleanupPipeline.exec();
      //   }
    } catch (error) {
      this.logger.error(
        `Failed to cleanup disconnected socket ${socketId}:`,
        error,
      );
    }
  }
}

/* Ride Socket Sets
Key: "ride:123:sockets" 
Value: Set of socket IDs ["socket1", "socket2", "socket3"]
Purpose: Track all parents in a specific ride
*/

/* Child-to-Parent Mapping
Key: "child:456:parentSocket"
Value: String socket ID "socket1"  
Purpose: Find which parent socket belongs to a specific child
*/

/*
Driver Room Sets
Key: "driver:789:sockets"
Value: Set of socket IDs ["socket1", "socket2"] 
Purpose: Track parents who've been "picked up" by this driver
*/

/*
Index Sets (for cleanup)
Key: "allRideSockets" 
Value: Set of ride keys ["ride:123:sockets", "ride:456:sockets"]
Key: "allDriverRooms"
Value: Set of driver keys ["driver:789:sockets", "driver:012:sockets"]
Purpose: Remember all active rooms for cleanup operations
*/
