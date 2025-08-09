# Tracking App Notes

📦 Code Overview

1. driver.gateway.ts : Listens to driver location updates, publishes them to Redis.
2. admin.gateway.ts : Listens to `location:driver` Redis Pub/Sub and emits updates to `admin:panel`.
3. parent.gateway.ts : Handles parent socket joins/leaves based on pickup/drop logic.
4. redis-pubsub.service.ts : Core Redis Pub/Sub handler: subscribes, publishes, relays messages via WebSocket.
5. location.service.ts : Saves latest driver location in Redis and logs historical data in a Redis Stream.
6. redis.module.ts : Provides a Redis client using `@nestjs-modules/ioredis
7. app.module.ts : Assembles everything together: registers gateways, Redis pubsub, and tracking services.

## First connection Initiazation

### Driver's App

```js
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('connected');
});
```

### Parent's App

When the parent first connects to the backend websocket a socketId is generated and stored in redis and will be retrived later.

- Using url in postman: `http://localhost:3000?parentId=20&rideId=50&childId=105`
- Using code in frontend:

```ts
const socket = io('http://localhost:3000', {
  query: {
    parentId: '1',
    rideId: '123',
    childId: '55',
  },
});
```

### Admin App

What happens when admin connects:

- Admin join admin:panel on connection
- All driver's location updates are emitted to admin:panel
- Admin frontend receives all driver locations regardless of ride

🧭 The Flow (High-Level)

1. 🔌 Admin connects to server via WebSocket
2. 🧠 Server adds admin to admin:panel room
3. 🚗 Driver sends location update via WebSocket
4. 🛰️ Server broadcasts the location update to admin:panel
5. 🖥️ Admin frontend receives the location in real-time

Frontend Connection Code:

```ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  query: {
    adminId: 'admin', // anything
  },
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('✅ Connected to admin dashboard:', socket.id);
});

socket.on('driver:location', ({ driverId, location }) => {
  console.log(`📍 Driver ${driverId} location:`, location);
  /*
  You can now use this data to update:
  - Google Maps markers
  - Breadcrumb trails
  - Speed/direction
  - Table rows in a UI
  */
});
```

## Redis Pub/Sub Implementation Summary

1. Publish: DriverGateway

- When a driver sends their location via locationUpdate, it’s:
- Stored in Redis (driver:${driverId}:location)
- Logged to a Redis stream (stream:ride:${rideId})
- Sent directly to the parent room (driver:${driverId})
- Published via Redis Pub/Sub on location:driver channel

```ts
await this.redisPubSub.publishDriverLocationUpdate({ driverId, location });
```

2. Subscribe: RedisPubSubService

- On app start, subscribes to location:driver:

```ts
await this.subscriber.subscribe('location:driver');
```

When a message is received on this channel:

- It’s parsed and emitted to all clients in admin:panel room using the injected Socket.IO server.

```ts
this._server.to('admin:panel').emit('driver:location', data);
```

3. Set Server: AdminGateway

When AdminGateway starts, it injects the server instance into RedisPubSubService:

```ts
afterInit(server: Server) {
  this.redisPubSub.setSocketServer(server);
}

```

4. Emit: AdminGateway

All admins in admin:panel receive:Can be used to track all drivers live.

```ts
driver:location { driverId, location }

```

## Gateway Code Analysing

### ParentGateWay

### DriverGateWay

### AdminGateway

openssl rand -base64 32
