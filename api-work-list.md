# API WORK LIST

## PARENTS

1. Get a parent's profile details: `http://localhost:3001/api/parent`
2. Create a new parent: `http://localhost:3001/api/parent`
3. Change parents notifications settings: `http://localhost:3001/api/parent/notifications`
4. Get all students associated with a parent: `http://localhost:3001/api/parent/students`
5. create a new student : `http://localhost:3001/api/student`

## DAIRLY_RIDES

### GET ACTIONS

1. Get all the daily rides: `http://localhost:3001/api/dailyRides`
2. Get all the details of a specific ride (all the data and students e.t.c): `http://localhost:3001/api/dailyRides/:id`
3. Get rides using a specific query parameter:
   - history : return all the previous daily rides: `http://localhost:3001/api/parent/trips?filter:history`
   - today : returns all todays ride: `http://localhost:3001/api/parent/trips?filter:today`

### OTHERS

1. Create a new ride: `http://localhost:3001/api/dailyRides`
2. get all the trips associated with a parent: `http://localhost:3001/api/parent/trips`
3. get all the trips associated with a driver: `http://localhost:3001/api/student`

## DRIVER

### DRIVER STUFF

1. Return a parent's profile: `http://localhost:3001/api/driver`
2. Returns a driver's kyc: `http://localhost:3001/api/kyc`
3. Create a new kyc: `http://localhost:3001/api/kyc`
4. Get all the driver's notification details: `http://localhost:3001/api/driver/notifications`
5. Mark all the notifications as read: `http://localhost:3001/api/driver/notifications/read`
6. Update the driver's profile: `http://localhost:3001/api/driver`
7. Update the driver's Notificaion settings: `http://localhost:3001/api/driver/notifications`
8. Get the drivers vehicle details: `http://localhost:3001/api/driver/vehicle`
9. Create a new vehicle for a driver: `http://localhost:3001/api/vehicle`
10. Update the drivers vehicle details: `http://localhost:3001/api/driver/vehicle`
11. Get the driver's wallet: `http://localhost:3001/api/driver/wallet`
12. Update the driver's payment methods: `http://localhost:3001/api/driver/payment-methods`

### Trips

1. Get all the driver's trips: `http://localhost:3001/api/driver/trips`
2. Get all the driver's trip details: `http://localhost:3001/api/driver/trips/1`
3. Change ride status: `http://localhost:3001/api/driver/trips/:id/?status`
   - 'Requested'
   - 'Cancelled'
   - 'Ongoing'
   - 'Pending'
   - 'Completed'
4. Change daily ride status: `http://localhost:3001/api/driver/dairly_ride/:id/?status`
   - 'Active'
   - 'Inactive'
   - 'Started'
   - 'Finished'
5. Get all the driver's trips with the following filter options:
   - history : return all the previous daily rides: `http://localhost:3001/api/driver/trips?filter=history`
   - today: return todays dairly rides: `http://localhost:3001/api/driver/trips?filter=today`
   - pickup: returns all pickup rides: `http://localhost:3001/api/driver/trips?filter=pickup`
   - dropoff: returns all dropoff rides: `http://localhost:3001/api/driver/trips?filter=dropoff`
   - Total rides (across all time)
   - Upcoming rides (future dates)
   - Today's pickups count
   - Today's dropoffs count

6. Mark all dairly trips as active: `http://localhost:3001/api/driver/trips/active`
7. Mark all dairly trips as started: `http://localhost:3001/api/driver/trips/started`
8. Mark all dairly trips as finished: `http://localhost:3001/api/driver/trips/finished`
9. Mark all a specific dairly trip as started: `http://localhost:3001/api/driver/trips/finished`
