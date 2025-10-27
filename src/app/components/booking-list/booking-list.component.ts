import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Booking, BookingStatus } from '../../models/booking.model';
import { BookingService } from '../../services/booking.service';
import { AuthService, User } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { CompanyHolidayService } from '../../services/company-holiday.service';
import { CompanyHoliday } from '../../models/company-holiday.model';
import { NgbModal, NgbModalRef, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isWeekend: boolean;
    isHoliday: boolean;
    bookings: Booking[];
    isWorkingDay: boolean; // Giorno lavorativo futuro
    isPast: boolean;
}

interface BookingFilters {
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
    @ViewChild('bookingDetailsModal') bookingDetailsModal?: TemplateRef<any>;
    @ViewChild('confirmModal') confirmModal?: TemplateRef<any>;
    @ViewChild('successModal') successModal?: TemplateRef<any>;
    @ViewChild('errorModal') errorModal?: TemplateRef<any>;

    // Calendario
    currentDate: Date = new Date();
    calendarDays: CalendarDay[] = [];
    weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

    // Prenotazioni
    bookings: Booking[] = [];
    allUsers: User[] = [];
    holidays: CompanyHoliday[] = [];
    loading = false;
    userId: number = 1;
    currentUser: User | null = null;
    selectedBooking: Booking | null = null;

    // Filtri
    filters: BookingFilters = {};
    showFilters = false;
    userSearchTerm: string = '';
    filteredUsers: User[] = [];

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
        private holidayService: CompanyHolidayService,
        private modalService: NgbModal,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.currentUser = this.authService.currentUserValue;
        if (this.currentUser) {
            this.userId = this.currentUser.id;
        }

        this.loadHolidays();

        if (this.isAdminOrManager()) {
            this.loadAllUsers();
        }
    }

    isAdminOrManager(): boolean {
        return this.authService.isAdmin || this.authService.isManager;
    }

    isUser(): boolean {
        return !this.isAdminOrManager();
    }

    loadHolidays(): void {
        const startDate = this.formatDate(this.getMonthStart(this.currentDate));
        const endDate = this.formatDate(this.getMonthEnd(this.currentDate));

        this.holidayService.getHolidaysBetween(startDate, endDate).subscribe({
            next: (holidays) => {
                this.holidays = holidays;
                this.loadBookings();
            },
            error: (error) => {
                console.error('Errore caricamento festività:', error);
                this.holidays = [];
                this.loadBookings();
            }
        });
    }

    loadBookings(): void {
        this.loading = true;

        const targetUserId = this.filters.userEmail
            ? this.allUsers.find(u => u.email === this.filters.userEmail)?.id || this.userId
            : this.userId;

        this.bookingService.getUserUpcomingBookings(targetUserId).subscribe({
            next: (bookings) => {
                this.bookings = this.applyStatusFilter(bookings);
                this.generateCalendar();
                this.loading = false;
            },
            error: (error) => {
                console.error('Errore nel caricamento delle prenotazioni:', error);
                this.showError('Errore nel caricamento delle prenotazioni');
                this.loading = false;
            }
        });
    }

    applyStatusFilter(bookings: Booking[]): Booking[] {
        if (!this.filters.status) {
            return bookings;
        }
        return bookings.filter(b => b.status === this.filters.status);
    }

    loadAllUsers(): void {
        this.userService.getAllUsers().subscribe({
            next: (users) => {
                this.allUsers = users;
                this.filteredUsers = users;
            },
            error: (error) => {
                console.error('Errore caricamento utenti:', error);
            }
        });
    }

    filterUsers(): void {
        if (!this.userSearchTerm.trim()) {
            this.filteredUsers = this.allUsers;
            return;
        }

        const searchTerm = this.userSearchTerm.toLowerCase();
        this.filteredUsers = this.allUsers.filter(user =>
            user.email.toLowerCase().includes(searchTerm) ||
            user.firstName.toLowerCase().includes(searchTerm)||
            user.lastName.toLowerCase().includes(searchTerm)
        );
    }

    selectUser(user: User): void {
        this.filters.userEmail = user.email;
        this.userSearchTerm = `${user.firstName} ${user.lastName}(${user.email})`;
        this.filteredUsers = [];
        this.applyFilters();
    }

    clearUserFilter(): void {
        this.filters.userEmail = undefined;
        this.userSearchTerm = '';
        this.filteredUsers = this.allUsers;
        this.applyFilters();
    }

    applyFilters(): void {
        this.loadBookings();
    }

    resetFilters(): void {
        this.filters = {};
        this.userSearchTerm = '';
        this.filteredUsers = this.allUsers;
        this.loadBookings();
    }

    generateCalendar(): void {
        this.calendarDays = [];
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Calcola il primo giorno del calendario (lunedì precedente al primo del mese)
        const startDate = new Date(firstDay);
        const dayOfWeek = firstDay.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(startDate.getDate() - daysToSubtract);

        // Genera 42 giorni (6 settimane)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            date.setHours(0, 0, 0, 0);

            const isCurrentMonth = date.getMonth() === month;
            const dateString = this.formatDate(date);
            const dayBookings = this.bookings.filter(b => b.bookingDate === dateString);

            this.calendarDays.push({
                date: date,
                isCurrentMonth: isCurrentMonth,
                isToday: date.getTime() === today.getTime(),
                isWeekend: this.isWeekend(date),
                isHoliday: this.isHoliday(date),
                bookings: dayBookings,
                isWorkingDay: this.isWorkingDay(date) && date > today,
                isPast: date < today
            });
        }
    }

    isWeekend(date: Date): boolean {
        const day = date.getDay();
        return day === 0 || day === 6;
    }

    isHoliday(date: Date): boolean {
        const dateString = this.formatDate(date);
        return this.holidays.some(h => {
            if (h.recurring) {
                const holidayDate = new Date(h.date);
                return date.getMonth() === holidayDate.getMonth() &&
                    date.getDate() === holidayDate.getDate();
            }
            return h.date === dateString;
        });
    }

    isWorkingDay(date: Date): boolean {
        return !this.isWeekend(date) && !this.isHoliday(date);
    }

    onDayClick(day: CalendarDay): void {
        // Se ci sono prenotazioni, mostra il modale con i dettagli
        if (day.bookings.length > 0) {
            this.selectedBooking = day.bookings[0]; // Prende la prima prenotazione
            this.openBookingDetailsModal();
            return;
        }

        // Se è un giorno lavorativo futuro e l'utente è USER, apri la mappa
        if (this.isUser() && day.isWorkingDay && !day.isPast) {
            this.navigateToBookingPage(day.date);
        }
    }

    navigateToBookingPage(date: Date): void {
        // Naviga alla pagina di prenotazione con la data preselezionata
        // La logica di preselezionare la data andrà gestita nella booking-page
        this.router.navigate(['/booking'], {
            queryParams: {
                date: this.formatDate(date)
            }
        });
    }

    openBookingDetailsModal(): void {
        if (this.bookingDetailsModal) {
            this.modalRef = this.modalService.open(this.bookingDetailsModal, {
                centered: true,
                size: 'lg'
            });
        }
    }

    previousMonth(): void {
        this.currentDate = new Date(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth() - 1,
            1
        );
        this.loadHolidays();
    }

    nextMonth(): void {
        this.currentDate = new Date(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth() + 1,
            1
        );
        this.loadHolidays();
    }

    goToToday(): void {
        this.currentDate = new Date();
        this.loadHolidays();
    }

    getMonthName(): string {
        return this.currentDate.toLocaleDateString('it-IT', {
            month: 'long',
            year: 'numeric'
        });
    }

    getMonthStart(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    getMonthEnd(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }

    formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Azioni prenotazione
    confirmCancellation(booking: Booking): void {
        this.selectedBooking = booking;
        this.modalTitle = 'Conferma Cancellazione';
        this.modalMessage = `Sei sicuro di voler cancellare la prenotazione per il ${booking.bookingDate}?`;
        this.modalIcon = 'bi-exclamation-triangle-fill text-warning';
        this.pendingAction = () => this.cancelBooking(booking);

        if (this.confirmModal) {
            this.modalRef = this.modalService.open(this.confirmModal, { centered: true });
        }
    }

    cancelBooking(booking: Booking): void {
        this.bookingService.cancelBooking(booking.id).subscribe({
            next: () => {
                this.showSuccess('Prenotazione cancellata con successo!');
                this.loadBookings();
                this.closeModal();
            },
            error: (error) => {
                console.error('Errore nella cancellazione:', error);
                this.showError('Errore nella cancellazione della prenotazione.');
            }
        });
    }

    checkIn(booking: Booking): void {
        this.bookingService.checkIn(booking.id).subscribe({
            next: () => {
                this.showSuccess('Check-in effettuato con successo!');
                this.loadBookings();
                this.closeModal();
            },
            error: (error) => {
                console.error('Errore nel check-in:', error);
                this.showError('Errore durante il check-in.');
            }
        });
    }

    checkOut(booking: Booking): void {
        this.bookingService.checkOut(booking.id).subscribe({
            next: () => {
                this.showSuccess('Check-out effettuato con successo!');
                this.loadBookings();
                this.closeModal();
            },
            error: (error) => {
                console.error('Errore nel check-out:', error);
                this.showError('Errore durante il check-out.');
            }
        });
    }

    canCheckIn(booking: Booking): boolean {
        const today = this.formatDate(new Date());
        return booking.status === BookingStatus.ACTIVE && booking.bookingDate === today;
    }

    canCheckOut(booking: Booking): boolean {
        return booking.status === BookingStatus.CHECKED_IN;
    }

    canCancel(booking: Booking): boolean {
        return booking.status === BookingStatus.ACTIVE;
    }

    getStatusBadgeClass(status: BookingStatus): string {
        switch (status) {
            case BookingStatus.ACTIVE:
                return 'bg-primary';
            case BookingStatus.CHECKED_IN:
                return 'bg-success';
            case BookingStatus.CHECKED_OUT:
                return 'bg-secondary';
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
                return 'Check-in';
            case BookingStatus.CHECKED_OUT:
                return 'Check-out';
            case BookingStatus.CANCELLED:
                return 'Cancellata';
            default:
                return status;
        }
    }

    // Gestione modali
    closeModal(): void {
        if (this.modalRef) {
            this.modalRef.close();
        }
    }

    confirmAction(): void {
        if (this.pendingAction) {
            this.pendingAction();
            this.pendingAction = undefined;
        }
        this.closeModal();
    }

    showSuccess(message: string): void {
        this.modalTitle = 'Operazione completata';
        this.modalMessage = message;
        this.modalIcon = 'bi-check-circle-fill text-success';

        if (this.successModal) {
            this.modalRef = this.modalService.open(this.successModal, { centered: true });
        }
    }

    showError(message: string): void {
        this.modalTitle = 'Errore';
        this.modalMessage = message;
        this.modalIcon = 'bi-x-circle-fill text-danger';

        if (this.errorModal) {
            this.modalRef = this.modalService.open(this.errorModal, { centered: true });
        }
    }
}
