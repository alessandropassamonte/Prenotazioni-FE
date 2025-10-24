import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Booking, BookingStatus } from '../../models/booking.model';
import { BookingService } from '../../services/booking.service';
import { AuthService, User } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { NgbModal, NgbModalRef, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

interface BookingFilters {
    startDate?: string;
    endDate?: string;
    userEmail?: string;
    status?: BookingStatus;
}

@Component({
    selector: 'app-booking-list',
    standalone: true,
    imports: [CommonModule, FormsModule, NgbModalModule],
    templateUrl: './booking-list.component.html',
    styleUrls: ['./booking-list.component.scss']
})
export class BookingListComponent implements OnInit {
    @ViewChild('confirmModal') confirmModal?: TemplateRef<any>;
    @ViewChild('successModal') successModal?: TemplateRef<any>;
    @ViewChild('errorModal') errorModal?: TemplateRef<any>;

    bookings: Booking[] = [];
    filteredBookings: Booking[] = [];
    allUsers: User[] = [];
    loading = false;
    userId: number = 1;
    currentUser: User | null = null;

    // Filtri
    filters: BookingFilters = {};
    showFilters = false;

    // Modali
    modalRef?: NgbModalRef;
    modalTitle = '';
    modalMessage = '';
    modalIcon = '';
    pendingAction?: () => void;

    // Status enum
    BookingStatus = BookingStatus;

    constructor(
        private bookingService: BookingService,
        private authService: AuthService,
        private userService: UserService,
        private modalService: NgbModal
    ) {}

    ngOnInit(): void {
        // Ottieni l'utente corrente
        this.currentUser = this.authService.currentUserValue;
        if (this.currentUser) {
            this.userId = this.currentUser.id;
        }

        this.loadUpcomingBookings();

        // Carica lista utenti se ADMIN o MANAGER
        if (this.isAdminOrManager()) {
            this.loadAllUsers();
        }
    }

    isAdminOrManager(): boolean {
        return this.authService.isAdmin || this.authService.isManager;
    }

    loadUpcomingBookings(): void {
        this.loading = true;
        this.bookingService.getUserUpcomingBookings(this.userId).subscribe({
            next: (bookings) => {
                this.bookings = bookings;
                this.applyFilters();
                this.loading = false;
                console.log('Prenotazioni caricate:', bookings.length);
            },
            error: (error) => {
                console.error('Errore nel caricamento delle prenotazioni:', error);
                this.showError('Errore nel caricamento delle prenotazioni');
                this.loading = false;
            }
        });
    }

    loadAllUsers(): void {
        this.userService.getAllUsers().subscribe({
            next: (users:  any[]) => {
                this.allUsers = users;
                console.log('Utenti caricati:', users.length);
            },
            error: (error: any) => {
                console.error('Errore nel caricamento degli utenti:', error);
            }
        });
    }

    applyFilters(): void {
        this.filteredBookings = this.bookings.filter(booking => {
            // Filtro data inizio
            if (this.filters.startDate) {
                if (booking.bookingDate < this.filters.startDate) {
                    return false;
                }
            }

            // Filtro data fine
            if (this.filters.endDate) {
                if (booking.bookingDate > this.filters.endDate) {
                    return false;
                }
            }

            // Filtro utente (solo per ADMIN/MANAGER)
            if (this.filters.userEmail && this.isAdminOrManager()) {
                if (!booking.userEmail?.toLowerCase().includes(this.filters.userEmail.toLowerCase())) {
                    return false;
                }
            }

            // Filtro status
            if (this.filters.status) {
                if (booking.status !== this.filters.status) {
                    return false;
                }
            }

            return true;
        });
    }

    resetFilters(): void {
        this.filters = {};
        this.applyFilters();
    }

    toggleFilters(): void {
        this.showFilters = !this.showFilters;
    }

    // Azioni con conferma tramite modale
    confirmCancelBooking(booking: Booking): void {
        this.modalTitle = 'Conferma Cancellazione';
        this.modalMessage = `Sei sicuro di voler cancellare la prenotazione per la postazione ${booking.deskNumber}?`;
        this.modalIcon = 'bi-exclamation-triangle-fill text-warning';
        this.pendingAction = () => this.cancelBooking(booking);
        this.openConfirmModal();
    }

    confirmCheckIn(booking: Booking): void {
        this.modalTitle = 'Conferma Check-in';
        this.modalMessage = `Confermi il check-in per la postazione ${booking.deskNumber}?`;
        this.modalIcon = 'bi-check-circle-fill text-success';
        this.pendingAction = () => this.checkIn(booking);
        this.openConfirmModal();
    }

    confirmCheckOut(booking: Booking): void {
        this.modalTitle = 'Conferma Check-out';
        this.modalMessage = `Confermi il check-out dalla postazione ${booking.deskNumber}?`;
        this.modalIcon = 'bi-box-arrow-right text-info';
        this.pendingAction = () => this.checkOut(booking);
        this.openConfirmModal();
    }

    // Azioni effettive
    cancelBooking(booking: Booking): void {
        this.bookingService.cancelBooking(booking.id).subscribe({
            next: () => {
                console.log('Prenotazione cancellata con successo');
                this.showSuccess('Prenotazione cancellata con successo!');
                this.loadUpcomingBookings();
            },
            error: (error) => {
                console.error('Errore nella cancellazione:', error);
                this.showError('Errore nella cancellazione della prenotazione. Riprova.');
            }
        });
    }

    checkIn(booking: Booking): void {
        this.bookingService.checkIn(booking.id).subscribe({
            next: () => {
                console.log('Check-in effettuato con successo');
                this.showSuccess('Check-in effettuato con successo!');
                this.loadUpcomingBookings();
            },
            error: (error) => {
                console.error('Errore nel check-in:', error);
                this.showError('Errore durante il check-in. Riprova.');
            }
        });
    }

    checkOut(booking: Booking): void {
        this.bookingService.checkOut(booking.id).subscribe({
            next: () => {
                console.log('Check-out effettuato con successo');
                this.showSuccess('Check-out effettuato con successo!');
                this.loadUpcomingBookings();
            },
            error: (error) => {
                console.error('Errore nel check-out:', error);
                this.showError('Errore durante il check-out. Riprova.');
            }
        });
    }

    // Gestione modali
    openConfirmModal(): void {
        if (this.confirmModal) {
            this.modalRef = this.modalService.open(this.confirmModal, {
                centered: true,
                backdrop: 'static'
            });
        }
    }

    executeAction(): void {
        if (this.pendingAction) {
            this.pendingAction();
            this.pendingAction = undefined;
        }
        this.modalRef?.close();
    }

    showSuccess(message: string): void {
        this.modalTitle = 'Operazione completata';
        this.modalMessage = message;
        this.modalIcon = 'bi-check-circle-fill text-success';
        if (this.successModal) {
            this.modalRef = this.modalService.open(this.successModal, {
                centered: true
            });
        }
    }

    showError(message: string): void {
        this.modalTitle = 'Errore';
        this.modalMessage = message;
        this.modalIcon = 'bi-x-circle-fill text-danger';
        if (this.errorModal) {
            this.modalRef = this.modalService.open(this.errorModal, {
                centered: true
            });
        }
    }

    closeModal(): void {
        this.modalRef?.close();
    }

    // Utility methods
    getStatusBadgeClass(status: BookingStatus): string {
        switch (status) {
            case BookingStatus.ACTIVE:
                return 'bg-primary';
            case BookingStatus.CHECKED_IN:
                return 'bg-success';
            case BookingStatus.CHECKED_OUT:
                return 'bg-info';
            case BookingStatus.CANCELLED:
                return 'bg-danger';
            default:
                return 'bg-secondary';
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

    getTodayDate(): string {
        return new Date().toISOString().split('T')[0];
    }
}
