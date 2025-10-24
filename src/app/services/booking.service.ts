import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Booking, 
  BookingDetail, 
  CreateBookingRequest, 
  UpdateBookingRequest,
  CancelBookingRequest 
} from '../models/booking.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  getAllBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(this.apiUrl);
  }

  getBookingById(id: number): Observable<BookingDetail> {
    return this.http.get<BookingDetail>(`${this.apiUrl}/${id}`);
  }

  getUserBookings(userId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/user/${userId}`);
  }

  getUserUpcomingBookings(userId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/user/${userId}/upcoming`);
  }

  getBookingsForDate(date: string): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/date/${date}`);
  }

  getBookingsForDateAndFloor(date: string, floorId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/date/${date}/floor/${floorId}`);
  }

  createBooking(userId: number, request: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(`${this.apiUrl}/user/${userId}`, request);
  }

  updateBooking(bookingId: number, request: UpdateBookingRequest): Observable<Booking> {
    return this.http.put<Booking>(`${this.apiUrl}/${bookingId}`, request);
  }

  cancelBooking(bookingId: number, request?: CancelBookingRequest): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${bookingId}`, { 
      body: request || {}
    });
  }

  checkIn(bookingId: number): Observable<Booking> {
    return this.http.post<Booking>(`${this.apiUrl}/${bookingId}/check-in`, {});
  }

  checkOut(bookingId: number): Observable<Booking> {
    return this.http.post<Booking>(`${this.apiUrl}/${bookingId}/check-out`, {});
  }
}
