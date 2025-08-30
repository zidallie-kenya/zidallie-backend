// types/enums.ts
export enum Gender {
  Male = 'Male',
  Female = 'Female',
}

export enum VehicleType {
  Bus = 'Bus',
  Van = 'Van',
  Car = 'Car',
}

export enum VehicleStatus {
  Active = 'Active',
  Inactive = 'Inactive',
}

export enum RideStatus {
  Requested = 'Requested',
  Cancelled = 'Cancelled',
  Ongoing = 'Ongoing',
  Pending = 'Pending',
  Completed = 'Completed',
}

export enum DailyRideKind {
  Pickup = 'Pickup',
  Dropoff = 'Dropoff',
}

export enum DailyRideStatus {
  Active = 'Ongoing',
  Inactive = 'Inactive',
  Started = 'Started',
  Finished = 'Finished',
}

export enum PaymentKind {
  Bank = 'Bank',
  MPesa = 'M-Pesa',
}

export enum TransactionType {
  Deposit = 'Deposit',
  Withdrawal = 'Withdrawal',
}

export enum NotificationKind {
  Personal = 'Personal',
  System = 'System',
}

export enum NotificationSection {
  Profile = 'Profile',
  Rides = 'Rides',
  Vehicle = 'Vehicle',
  Payments = 'Payments',
  Other = 'Other',
}

export enum RideType {
  Dropoff = 'dropoff',
  Pickup = 'pickup',
  PickupAndDropoff = 'pickup & dropoff',
}
