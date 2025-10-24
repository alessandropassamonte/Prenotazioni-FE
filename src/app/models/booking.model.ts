export interface Booking {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  deskId: number;
  deskNumber?: string;
  floorId?: number;
  floorName?: string;
  bookingDate: string; // ISO date format
  startTime?: string;
  endTime?: string;
  status: BookingStatus;
  type: BookingType;
  notes?: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  createdAt?: string;
}

export interface BookingDetail extends Booking {
  user?: User;
  desk?: Desk;
  cancellationReason?: string;
}

export interface CreateBookingRequest {
  deskId: number;
  bookingDate: string; // ISO date format
  startTime?: string;
  endTime?: string;
  type: BookingType;
  notes?: string;
}

export interface UpdateBookingRequest {
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

export interface CancelBookingRequest {
  cancellationReason?: string;
}

export enum BookingStatus {
  ACTIVE = 'ACTIVE',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export enum BookingType {
  FULL_DAY = 'FULL_DAY',
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  CUSTOM = 'CUSTOM'
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  employeeId: string;
  departmentId?: number;
  departmentName?: string;
  role: UserRole;
  workType: WorkType;
  phoneNumber?: string;
  avatarUrl?: string;
  active: boolean;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER'
}

export enum WorkType {
  STANDARD = 'STANDARD',
  TURNISTA = 'TURNISTA',
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID'
}

import { Desk } from './floor.model';
