import { Component, Input, OnChanges, SimpleChanges, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Floor, Desk } from '../../models/floor.model';
import { Booking, BookingType, CreateBookingRequest } from '../../models/booking.model';
import { DeskService } from '../../services/desk.service';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { NgbTooltipModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

interface DeskPosition {
    desk: Desk;
    x: number;
    y: number;
    available: boolean;
    bookedByCurrentUser?: boolean;
    booking?: Booking;
}

@Component({
    selector: 'app-floor-map',
    standalone: true,
    imports: [CommonModule, NgbTooltipModule],
    templateUrl: './floor-map.component.html',
    styleUrls: ['./floor-map.component.scss']
})
export class FloorMapComponent implements OnInit, OnChanges {
    @Input() floor?: Floor;
    @Input() selectedDate?: Date;

    @ViewChild('confirmModal') confirmModal?: TemplateRef<any>;
    @ViewChild('modifyModal') modifyModal?: TemplateRef<any>;
    @ViewChild('userInfoModal') userInfoModal?: TemplateRef<any>;

    desks: Desk[] = [];
    deskPositions: DeskPosition[] = [];
    loading = false;
    selectedDesk?: Desk;
    modalRef?: NgbModalRef;
    currentUserId: number = 1;
    existingBooking?: Booking;
    selectedBooking?: Booking;
    availableDesks: number = 0;
    occupiedDesks: number = 0;

    private floorLayouts: { [key: number]: { [deskNumber: string]: { x: number; y: number } } } = {
        1: this.generateFloor1Layout(),
        3: this.generateFloor3Layout()
    };

    constructor(
        private deskService: DeskService,
        private bookingService: BookingService,
        private authService: AuthService,
        private modalService: NgbModal
    ) {}

    ngOnInit(): void {
        const currentUser = this.authService.currentUserValue;
        if (currentUser) {
            this.currentUserId = currentUser.id;
            console.log('UserId ottenuto da AuthService:', this.currentUserId);
        } else {
            console.warn('Utente non autenticato, uso userId di fallback');
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if ((changes['floor'] || changes['selectedDate']) && this.floor && this.selectedDate) {
            this.loadDesks();
        }
    }

    loadDesks(): void {
        if (!this.floor || !this.selectedDate) return;

        this.loading = true;
        const dateString = this.formatDate(this.selectedDate);

        // PRIMA: Controlla se l'utente ha già una prenotazione per questa data (su qualsiasi piano)
        this.bookingService.getUserUpcomingBookings(this.currentUserId).subscribe({
            next: (userBookings) => {
                // Filtra per la data selezionata
                this.existingBooking = userBookings.find(b => b.bookingDate === dateString);

                if (this.existingBooking) {
                    console.log('Prenotazione esistente trovata per questa data:', this.existingBooking);
                    console.log('Piano prenotazione:', this.existingBooking.floorId, '- Piano corrente:', this.floor!.id);
                }

                // POI: Carica le postazioni disponibili
                this.deskService.getAvailableDesks(dateString, this.floor!.id).subscribe({
                    next: (availableDesks) => {
                        this.availableDesks = availableDesks.length;
                        // Carica tutte le postazioni del piano
                        this.deskService.getDesksByFloor(this.floor!.id).subscribe({
                            next: (allDesks) => {
                                this.desks = allDesks;
                                // Carica le prenotazioni per questo piano (per mostrare le postazioni occupate)
                                this.loadBookingsForDateAndFloor(dateString, availableDesks);
                            },
                            error: (error) => {
                                console.error('Errore nel caricamento delle postazioni:', error);
                                this.loading = false;
                            }
                        });
                    },
                    error: (error) => {
                        console.error('Errore nel caricamento della disponibilità:', error);
                        this.loading = false;
                    }
                });
            },
            error: (error) => {
                console.error('Errore nel caricamento delle prenotazioni utente:', error);
                // Continua comunque con il caricamento del piano
                this.existingBooking = undefined;

                this.deskService.getAvailableDesks(dateString, this.floor!.id).subscribe({
                    next: (availableDesks) => {
                        this.deskService.getDesksByFloor(this.floor!.id).subscribe({
                            next: (allDesks) => {
                                this.desks = allDesks;
                                this.loadBookingsForDateAndFloor(dateString, availableDesks);
                            }
                        });
                    }
                });
            }
        });
    }

    loadBookingsForDateAndFloor(dateString: string, availableDesks: Desk[]): void {
        if (!this.floor) return;

        this.bookingService.getBookingsForDateAndFloor(dateString, this.floor.id).subscribe({
            next: (bookings) => {
                this.occupiedDesks = bookings.length
                console.log('Prenotazioni del piano caricate:', bookings);
                // NON cercare più existingBooking qui - è già stato caricato in loadDesks()
                this.buildDeskPositions(availableDesks, bookings);
                this.loading = false;
            },
            error: (error) => {
                console.error('Errore nel caricamento delle prenotazioni:', error);
                // Fallback: costruisci senza le prenotazioni
                this.buildDeskPositions(availableDesks, []);
                this.loading = false;
            }
        });
    }

    buildDeskPositions(availableDesks: Desk[], bookings: Booking[]): void {
        if (!this.floor) return;

        const layout = this.floorLayouts[this.floor.floorNumber] || {};
        this.deskPositions = [];

        this.desks.forEach(desk => {
            const position = layout[desk.deskNumber] || this.getDefaultPosition(desk.deskNumber);
            const isAvailable = availableDesks.some(d => d.id === desk.id);
            const booking = bookings.find(b => b.deskId === desk.id);
            const bookedByCurrentUser = booking?.userId === this.currentUserId;

            this.deskPositions.push({
                desk,
                x: position.x,
                y: position.y,
                available: isAvailable,
                bookedByCurrentUser,
                booking
            });
        });

        console.log('DeskPositions created:', this.deskPositions.length);
    }

    onDeskClick(deskPosition: DeskPosition): void {
        // Se la postazione è occupata, mostra le info dell'utente
        if (!deskPosition.available) {
            if (deskPosition.booking) {
                this.selectedBooking = deskPosition.booking;
                this.openUserInfoModal();
            }
            return;
        }

        // Se l'utente ha già una prenotazione per questa data
        if (this.existingBooking) {
            // Se sta cliccando sulla sua postazione, non fare nulla
            if (this.existingBooking.deskId === deskPosition.desk.id) {
                alert('Hai già prenotato questa postazione per questa data!');
                return;
            }
            // Altrimenti apri il modale di modifica
            this.selectedDesk = deskPosition.desk;
            this.openModifyModal();
        } else {
            // Nessuna prenotazione esistente, apri il modale di conferma normale
            this.selectedDesk = deskPosition.desk;
            this.openConfirmModal();
        }
    }

    openConfirmModal(): void {
        this.modalRef = this.modalService.open(this.confirmModal, {
            centered: true
        });
    }

    openModifyModal(): void {
        this.modalRef = this.modalService.open(this.modifyModal, {
            centered: true
        });
    }

    openUserInfoModal(): void {
        this.modalRef = this.modalService.open(this.userInfoModal, {
            centered: true
        });
    }

    confirmBooking(): void {
        if (!this.selectedDesk || !this.selectedDate) return;

        if (!this.authService.isAuthenticated) {
            alert('Devi essere autenticato per prenotare una postazione');
            this.modalRef?.close();
            return;
        }

        const request: CreateBookingRequest = {
            deskId: this.selectedDesk.id,
            bookingDate: this.formatDate(this.selectedDate),
            type: BookingType.FULL_DAY
        };

        console.log('Creazione prenotazione con userId:', this.currentUserId);

        this.bookingService.createBooking(this.currentUserId, request).subscribe({
            next: (booking) => {
                console.log('Prenotazione creata con successo:', booking);
                alert('Prenotazione effettuata con successo!');
                this.modalRef?.close();
                this.loadDesks();
            },
            error: (error) => {
                console.log( error);
                alert(error?.message);
            }
        });
    }

    confirmModifyBooking(): void {
        if (!this.selectedDesk || !this.selectedDate || !this.existingBooking) return;

        // Cancella la prenotazione esistente
        this.bookingService.cancelBooking(this.existingBooking.id, {
            cancellationReason: 'Modifica postazione'
        }).subscribe({
            next: () => {
                console.log('Prenotazione precedente cancellata');
                // Crea la nuova prenotazione
                const request: CreateBookingRequest = {
                    deskId: this.selectedDesk!.id,
                    bookingDate: this.formatDate(this.selectedDate!),
                    type: BookingType.FULL_DAY
                };

                this.bookingService.createBooking(this.currentUserId, request).subscribe({
                    next: (booking) => {
                        console.log('Nuova prenotazione creata con successo:', booking);
                        alert('Prenotazione modificata con successo!');
                        this.modalRef?.close();
                        this.existingBooking = undefined;
                        this.loadDesks();
                    },
                    error: (error) => {
                        console.error('Errore nella creazione della nuova prenotazione:', error);
                        alert(error?.message);
                    }
                });
            },
            error: (error) => {
                console.error('Errore nella cancellazione della prenotazione precedente:', error);
                alert(error?.message);
            }
        });
    }

    cancelBooking(): void {
        this.selectedDesk = undefined;
        this.modalRef?.close();
    }

    closeModal(): void {
        this.selectedBooking = undefined;
        this.modalRef?.close();
    }

    getDeskClass(deskPosition: DeskPosition): { [key: string]: boolean } {
        return {
            'desk-circle': true,
            'desk-my-booking': deskPosition.bookedByCurrentUser === true,
            'desk-available': !deskPosition.bookedByCurrentUser && deskPosition.available,
            'desk-occupied': !deskPosition.bookedByCurrentUser && !deskPosition.available
        };
    }

    getDeskTooltip(deskPosition: DeskPosition): string {
        if (deskPosition.bookedByCurrentUser) {
            return `${deskPosition.desk.deskNumber} - La tua prenotazione`;
        }
        const status = deskPosition.available ? 'Disponibile' : 'Occupata';
        return `${deskPosition.desk.deskNumber} - ${status}`;
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private getDefaultPosition(deskNumber: string): { x: number; y: number } {
        const num = parseInt(deskNumber.replace(/\D/g, '')) || 0;
        return {
            x: 100 + (num % 10) * 80,
            y: 100 + Math.floor(num / 10) * 80
        };
    }

    // ============================================================================
    // LAYOUT PIANO 1 - 74 POSTAZIONI
    // ViewBox: 1200x848 (aspect ratio 1.414 - CORRETTO)
    // Formula: svgX = (x_px / 3509) * 1200, svgY = (y_px / 2481) * 848
    // ============================================================================
    private generateFloor1Layout(): { [deskNumber: string]: { x: number; y: number } } {
        const layout: { [deskNumber: string]: { x: number; y: number } } = {};

        layout['1'] = { x: 635.3, y: 101.5 };
        layout['2'] = { x: 635.3, y: 132.0 };
        layout['3'] = { x: 658.0, y: 101.5 };
        layout['4'] = { x: 658.0, y: 132.0 };
        layout['5'] = { x: 721.1, y: 101.5 };
        layout['6'] = { x: 721.1, y: 132.0};
        layout['7'] = { x: 744.5, y: 101.5 };
        layout['8'] = { x: 744.5, y: 132.0 };
        layout['9'] = { x: 803.8, y: 101.5 };
        layout['10'] = { x: 803.8, y: 132.0 };
        layout['11'] = { x: 827.6, y: 101.5 };
        layout['12'] = { x: 827.6, y: 132.0 };
        layout['13'] = { x: 884.0, y: 101.5 };
        layout['14'] = { x: 884.0, y: 132.0 };
        layout['15'] = { x: 909.6, y: 101.5 };
        layout['16'] = { x: 909.6, y: 132.0 };
        layout['17'] = { x: 948.2, y: 277.6 };
        layout['18'] = { x: 980.6, y: 277.6 };
        layout['19'] = { x: 1013.1, y: 277.6 };
        layout['20'] = { x: 948.2, y: 302.3 };
        layout['21'] = { x: 980.6, y: 301.4 };
        layout['22'] = { x: 1013.1, y: 302.3 };
        layout['23'] = { x: 948.2, y: 366.8 };
        layout['24'] = { x: 980.6, y: 366.8 };
        layout['25'] = { x: 1013.1, y: 366.8 };
        layout['26'] = { x: 948.2, y: 391.4 };
        layout['27'] = { x: 980.6, y: 391.4 };
        layout['28'] = { x: 1013.1, y: 391.4 };
        layout['29'] = { x: 980.6, y: 457.2 };
        layout['30'] = { x: 1013.1, y: 457.2 };
        layout['31'] = { x: 980.6, y: 481.9};
        layout['32'] = { x: 1013.1, y: 481.9 };
        layout['33'] = { x: 980.6, y: 541.6 };
        layout['34'] = { x: 1013.1, y: 541.6 };
        layout['35'] = { x: 980.6, y: 566.5 };
        layout['36'] = { x: 1013.1, y: 566.5 };
        layout['37'] = { x: 980.6, y: 631.7 };
        layout['38'] = { x: 1013.1, y: 631.7  };
        layout['39'] = { x: 980.6, y: 657.2 };
        layout['40'] = { x: 1013.1, y: 657.2 };
        layout['41'] = { x: 885.1, y: 742.7 };
        layout['42'] = { x: 886.9, y: 772.5 };
        layout['43'] = { x: 846.3, y: 740.9 };
        layout['44'] = { x: 846.3, y: 775.2 };
        layout['45'] = { x: 823.8, y: 736.4 };
        layout['46'] = { x: 825.6, y: 774.3 };
        layout['47'] = { x: 763.4, y: 743.6 };
        layout['48'] = { x: 761.6, y: 776.1 };
        layout['49'] = { x: 743.6, y: 744.5 };
        layout['50'] = { x: 743.6, y: 776.1 };
        layout['51'] = { x: 678.7, y: 740.9 };
        layout['52'] = { x: 679.6, y: 773.4 };
        layout['53'] = { x: 659.8, y: 740.9 };
        layout['54'] = { x: 659.8, y: 773.4 };
        layout['55'] = { x: 536.3, y: 657.2 };
        layout['56'] = { x: 568.8, y: 657.2 };
        layout['57'] = { x: 535.4, y: 637.3 };
        layout['58'] = { x: 568.8, y: 635.5 };
        layout['59'] = { x: 533.6, y: 565.3 };
        layout['60'] = { x: 567.0, y: 565.3 };
        layout['61'] = { x: 533.6, y: 545.5 };
        layout['62'] = { x: 567.0, y: 544.6 };
        layout['63'] = { x: 532.7, y: 472.5 };
        layout['64'] = { x: 563.3, y: 472.5 };
        layout['65'] = { x: 531.8, y: 452.7 };
        layout['66'] = { x: 567.9, y: 450.9 };
        layout['67'] = { x: 529.1, y: 382.4 };
        layout['68'] = { x: 567.0, y: 383.3 };
        layout['69'] = { x: 533.6, y: 363.5 };
        layout['70'] = { x: 567.9, y: 363.5 };
        layout['71'] = { x: 530.0, y: 294.1 };
        layout['72'] = { x: 567.0, y: 294.1 };
        layout['73'] = { x: 534.5, y: 274.3 };
        layout['74'] = { x: 569.7, y: 273.4 };

        return layout;
    }

    // ============================================================================
    // LAYOUT PIANO 3 - 40 POSTAZIONI
    // ViewBox: 1200x848
    // ============================================================================
    private generateFloor3Layout(): { [deskNumber: string]: { x: number; y: number } } {
        const layout: { [deskNumber: string]: { x: number; y: number } } = {};

        layout['1'] = { x: 544.4, y: 92.4 };
        layout['2'] = { x: 544.4, y: 123.9 };
        layout['3'] = { x: 559.7, y: 94.2 };
        layout['4'] = { x: 562.4, y: 125.7 };
        layout['5'] = { x: 625.5, y: 94.2 };
        layout['6'] = { x: 627.3, y: 127.5 };
        layout['7'] = { x: 648.1, y: 96.0 };
        layout['8'] = { x: 646.3, y: 131.1 };
        layout['9'] = { x: 708.5, y: 95.1 };
        layout['10'] = { x: 706.7, y: 126.6 };
        layout['11'] = { x: 733.7, y: 94.2 };
        layout['12'] = { x: 728.3, y: 123.0 };
        layout['13'] = { x: 794.1, y: 92.4 };
        layout['14'] = { x: 792.3, y: 125.7 };
        layout['15'] = { x: 813.9, y: 95.1 };
        layout['16'] = { x: 812.1, y: 128.4 };
        layout['17'] = { x: 850.0, y: 272.5 };
        layout['18'] = { x: 884.2, y: 272.5 };
        layout['19'] = { x: 914.8, y: 273.4 };
        layout['20'] = { x: 851.8, y: 293.2 };
        layout['21'] = { x: 883.3, y: 293.2 };
        layout['22'] = { x: 915.7, y: 293.2 };
        layout['23'] = { x: 854.5, y: 362.6 };
        layout['24'] = { x: 886.0, y: 361.7 };
        layout['25'] = { x: 917.6, y: 361.7 };
        layout['26'] = { x: 850.0, y: 381.5 };
        layout['27'] = { x: 886.0, y: 381.5 };
        layout['28'] = { x: 918.5, y: 378.8 };
        layout['29'] = { x: 849.1, y: 448.2 };
        layout['30'] = { x: 884.2, y: 450.0 };
        layout['31'] = { x: 916.6, y: 449.1 };
        layout['32'] = { x: 850.9, y: 468.0 };
        layout['33'] = { x: 884.2, y: 467.1 };
        layout['34'] = { x: 918.5, y: 467.1 };
        layout['35'] = { x: 877.9, y: 536.5 };
        layout['36'] = { x: 910.3, y: 533.8 };
        layout['37'] = { x: 877.0, y: 552.7 };
        layout['38'] = { x: 909.4, y: 554.5 };
        layout['39'] = { x: 877.0, y: 620.2 };
        layout['40'] = { x: 911.2, y: 624.7 };
        layout['41'] = { x: 878.8, y: 644.6 };
        layout['42'] = { x: 911.2, y: 640.1 };
        layout['43'] = { x: 897.7, y: 696.8 };
        layout['44'] = { x: 896.8, y: 728.3 };
        layout['45'] = { x: 895.9, y: 761.7 };
        layout['46'] = { x: 878.8, y: 695.9 };
        layout['47'] = { x: 875.2, y: 727.4 };
        layout['48'] = { x: 877.9, y: 760.8 };
        layout['49'] = { x: 804.0, y: 722.9 };
        layout['50'] = { x: 807.6, y: 755.4 };
        layout['51'] = { x: 783.3, y: 726.5 };
        layout['52'] = { x: 784.2, y: 759.9 };
        layout['53'] = { x: 548.9, y: 718.4 };
        layout['54'] = { x: 551.6, y: 753.6 };
        layout['55'] = { x: 532.7, y: 720.2 };
        layout['56'] = { x: 538.1, y: 755.4 };
        layout['57'] = { x: 466.9, y: 695.9 };
        layout['58'] = { x: 466.0, y: 723.8 };
        layout['59'] = { x: 465.1, y: 754.5 };
        layout['60'] = { x: 448.0, y: 694.1 };
        layout['61'] = { x: 448.0, y: 730.1 };
        layout['62'] = { x: 445.3, y: 760.8 };
        layout['63'] = { x: 439.0, y: 644.6 };
        layout['64'] = { x: 473.2, y: 643.7 };
        layout['65'] = { x: 438.1, y: 624.7 };
        layout['66'] = { x: 476.8, y: 623.8 };
        layout['67'] = { x: 439.9, y: 554.5 };
        layout['68'] = { x: 472.3, y: 556.3 };
        layout['69'] = { x: 504.8, y: 555.4 };
        layout['70'] = { x: 439.0, y: 535.6 };
        layout['71'] = { x: 472.3, y: 537.4 };
        layout['72'] = { x: 502.1, y: 532.9 };
        layout['73'] = { x: 437.2, y: 466.2 };
        layout['74'] = { x: 474.1, y: 468.0 };
        layout['75'] = { x: 444.4, y: 445.5 };
        layout['76'] = { x: 472.3, y: 445.5 };
        layout['77'] = { x: 441.7, y: 373.4 };
        layout['78'] = { x: 470.5, y: 373.4 };
        layout['79'] = { x: 443.5, y: 352.7 };
        layout['80'] = { x: 477.7, y: 352.7 };

        return layout;
    }
}
