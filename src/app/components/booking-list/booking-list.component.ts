import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Booking, BookingStatus } from '../../models/booking.model';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-booking-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './booking-list.component.html',
    styleUrls: ['./booking-list.component.scss']
})
export class BookingListComponent implements OnInit {
    bookings: Booking[] = [];
    loading = false;
    BookingStatus = BookingStatus;
    userId: number = 1; // Fallback se non autenticato

    constructor(
        private bookingService: BookingService,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        // Ottieni l'userId dall'AuthService
        const currentUser = this.authService.currentUserValue;
        if (currentUser) {
            this.userId = currentUser.id;
            console.log('UserId ottenuto da AuthService:', this.userId);
        } else {
            console.warn('Utente non autenticato, uso userId di fallback');
        }

        this.loadUpcomingBookings();
    }

    loadUpcomingBookings(): void {
        this.loading = true;
        this.bookingService.getUserUpcomingBookings(this.userId).subscribe({
            next: (bookings) => {
                this.bookings = bookings;
                this.loading = false;
                console.log('Prenotazioni caricate:', bookings.length);
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
                    console.log('Prenotazione cancellata con successo');
                    alert('Prenotazione cancellata con successo!');
                    this.loadUpcomingBookings();
                },
                error: (error) => {
                    console.error('Errore nella cancellazione:', error);
                    alert('Errore nella cancellazione della prenotazione. Riprova.');
                }
            });
        }
    }

    checkIn(booking: Booking): void {
        this.bookingService.checkIn(booking.id).subscribe({
            next: () => {
                console.log('Check-in effettuato con successo');
                alert('Check-in effettuato con successo!');
                this.loadUpcomingBookings();
            },
            error: (error) => {
                console.error('Errore nel check-in:', error);
                alert('Errore durante il check-in. Riprova.');
            }
        });
    }

    checkOut(booking: Booking): void {
        this.bookingService.checkOut(booking.id).subscribe({
            next: () => {
                console.log('Check-out effettuato con successo');
                alert('Check-out effettuato con successo!');
                this.loadUpcomingBookings();
            },
            error: (error) => {
                console.error('Errore nel check-out:', error);
                alert('Errore durante il check-out. Riprova.');
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
                return 'badge-info';
            case BookingStatus.CANCELLED:
                return 'badge-danger';
            default:
                return 'badge-secondary';
        }
    }

    getStatusLabel(status: BookingStatus): string {
        switch (status) {
            case BookingStatus.ACTIVE:
                return 'Attiva';
            case BookingStatus.CHECKED_IN:
                return 'Check-in effettuato';
            case BookingStatus.CHECKED_OUT:
                return 'Check-out effettuato';
            case BookingStatus.CANCELLED:
                return 'Cancellata';
            default:
                return status;
        }
    }

    canCheckIn(booking: Booking): boolean {
        const today = new Date().toISOString().split('T')[0];
        return booking.status === BookingStatus.ACTIVE &&
            booking.bookingDate === today;
    }

    canCheckOut(booking: Booking): boolean {
        return booking.status === BookingStatus.CHECKED_IN;
    }

    canCancel(booking: Booking): boolean {
        return booking.status === BookingStatus.ACTIVE;
    }
}
