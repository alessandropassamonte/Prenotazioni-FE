import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Booking, BookingStatus } from '../../models/booking.model';
import { BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-list.component.html',
  styleUrls: ['./booking-list.component.scss']
})
export class BookingListComponent implements OnInit {
  @Input() userId: number = 1; // TODO: Get from auth service
  
  bookings: Booking[] = [];
  loading = false;
  BookingStatus = BookingStatus;

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.loadUpcomingBookings();
  }

  loadUpcomingBookings(): void {
    this.loading = true;
    this.bookingService.getUserUpcomingBookings(this.userId).subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.loading = false;
      },
      error: (error) => {
        console.error('Errore nel caricamento delle prenotazioni:', error);
        this.loading = false;
      }
    });
  }

  cancelBooking(booking: Booking): void {
    if (confirm(`Sei sicuro di voler cancellare la prenotazione per la postazione ${booking.deskNumber}?`)) {
      this.bookingService.cancelBooking(booking.id).subscribe({
        next: () => {
          console.log('Prenotazione cancellata');
          this.loadUpcomingBookings();
          // TODO: Mostra messaggio di successo
        },
        error: (error) => {
          console.error('Errore nella cancellazione:', error);
          // TODO: Mostra messaggio di errore
        }
      });
    }
  }

  checkIn(booking: Booking): void {
    this.bookingService.checkIn(booking.id).subscribe({
      next: () => {
        console.log('Check-in effettuato');
        this.loadUpcomingBookings();
        // TODO: Mostra messaggio di successo
      },
      error: (error) => {
        console.error('Errore nel check-in:', error);
        // TODO: Mostra messaggio di errore
      }
    });
  }

  checkOut(booking: Booking): void {
    this.bookingService.checkOut(booking.id).subscribe({
      next: () => {
        console.log('Check-out effettuato');
        this.loadUpcomingBookings();
        // TODO: Mostra messaggio di successo
      },
      error: (error) => {
        console.error('Errore nel check-out:', error);
        // TODO: Mostra messaggio di errore
      }
    });
  }

  getStatusBadgeClass(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.ACTIVE:
        return 'badge-primary';
      case BookingStatus.CHECKED_IN:
        return 'badge-success';
      case BookingStatus.CHECKED_OUT:
        return 'badge-secondary';
      case BookingStatus.COMPLETED:
        return 'badge-info';
      case BookingStatus.CANCELLED:
        return 'badge-danger';
      case BookingStatus.NO_SHOW:
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  getStatusLabel(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.ACTIVE:
        return 'Attiva';
      case BookingStatus.CHECKED_IN:
        return 'Check-in Effettuato';
      case BookingStatus.CHECKED_OUT:
        return 'Check-out Effettuato';
      case BookingStatus.COMPLETED:
        return 'Completata';
      case BookingStatus.CANCELLED:
        return 'Cancellata';
      case BookingStatus.NO_SHOW:
        return 'Non Presentato';
      default:
        return status;
    }
  }

  canCheckIn(booking: Booking): boolean {
    return booking.status === BookingStatus.ACTIVE && 
           new Date(booking.bookingDate).toDateString() === new Date().toDateString();
  }

  canCheckOut(booking: Booking): boolean {
    return booking.status === BookingStatus.CHECKED_IN;
  }

  canCancel(booking: Booking): boolean {
    return booking.status === BookingStatus.ACTIVE || 
           booking.status === BookingStatus.CHECKED_IN;
  }
}
