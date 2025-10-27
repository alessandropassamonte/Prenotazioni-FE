import {
    Component,
    Input,
    OnChanges,
    SimpleChanges,
    ViewChild,
    TemplateRef,
    OnInit,
    ElementRef,
    AfterViewInit
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Floor, Desk} from '../../models/floor.model';
import {Booking, BookingType, CreateBookingRequest} from '../../models/booking.model';
import {DeskService} from '../../services/desk.service';
import {BookingService} from '../../services/booking.service';
import {AuthService} from '../../services/auth.service';
import {ModalService} from '../../services/modal.service';
import {NgbTooltipModule, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';

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
    imports: [CommonModule, NgbTooltipModule, FormsModule],
    templateUrl: './floor-map.component.html',
    styleUrls: ['./floor-map.component.scss']
})
export class FloorMapComponent implements OnInit, OnChanges, AfterViewInit {
    @Input() floor?: Floor;
    @Input() selectedDate?: Date;
    @Input() bookingId?: number;
    @Input() fromBookingList?: number;

    showMyBookingOnly: boolean = false;
    hasUserBookingForToday: boolean = false;

    @ViewChild('confirmModal') confirmModal?: TemplateRef<any>;
    @ViewChild('modifyModal') modifyModal?: TemplateRef<any>;
    @ViewChild('userInfoModal') userInfoModal?: TemplateRef<any>;
    @ViewChild('floorMapSvg', {static: false}) svgElement?: ElementRef<SVGSVGElement>;
    @ViewChild('cancelConfirmModal') cancelConfirmModal: any;

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

    // Search filter
    searchFilter: string = '';

    // Zoom and Pan properties
    zoomLevel = 1;
    minZoom = 1;
    maxZoom = 5;
    viewBoxX = 0;
    viewBoxY = 0;
    viewBoxWidth = 1200;
    viewBoxHeight = 848;

    panX = 0;
    panY = 0;
    startPanX = 0;
    startPanY = 0;
    isPanning = false;


    // Touch properties
    lastTouchDistance = 0;
    lastTouchCenter = {x: 0, y: 0};

    // Mouse position for zoom
    private lastMouseX = 0;
    private lastMouseY = 0;

    private floorLayouts: { [key: number]: { [deskNumber: string]: { x: number; y: number } } } = {
        1: this.generateFloor1Layout(),
        3: this.generateFloor3Layout()
    };

    constructor(
        private deskService: DeskService,
        private bookingService: BookingService,
        private authService: AuthService,
        private modalServiceNgb: NgbModal,
        private modalService: ModalService
    ) {
    }

    ngOnInit(): void {
        this.authService.currentUser.subscribe(user => {
            if (user) {
                this.currentUserId = user.id;
            }
        });

        // Se proviene da booking-list, attiva il filtro di default
        if (this.fromBookingList && this.bookingId) {
            this.showMyBookingOnly = true;
        }

        // Aggiungi listener per tracciare la posizione del mouse
        if (typeof window !== 'undefined') {
            window.addEventListener('mousemove', (e) => {
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            });
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if ((changes['floor'] || changes['selectedDate']) && this.floor && this.selectedDate) {
            this.loadDesks();
        }
    }

    ngAfterViewInit(): void {
        this.setupZoomListeners();
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

    canCancelBooking(): boolean {
        if (!this.selectedBooking) {
            return false;
        }

        // Può cancellare solo prenotazioni attive
        if (this.selectedBooking.status !== 'ACTIVE') {
            return false;
        }

        // Verifica che la data della prenotazione sia oggi o futura
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const bookingDate = new Date(this.selectedBooking.bookingDate);
        bookingDate.setHours(0, 0, 0, 0);

        return bookingDate >= today;
    }

    confirmCancelUserBooking(): void {
        // Chiudi il modale delle informazioni
        this.modalRef?.close();

        // Apri il modale di conferma
        setTimeout(() => {
            this.modalRef = this.modalServiceNgb.open(this.cancelConfirmModal, {
                centered: true
            });
        }, 300);
    }

// Esegue la cancellazione della prenotazione
    executeUserBookingCancellation(): void {
        if (!this.selectedBooking) return;

        this.bookingService.cancelBooking(this.selectedBooking.id, {
            cancellationReason: 'Cancellazione da mappa'
        }).subscribe({
            next: () => {
                console.log('Prenotazione cancellata con successo');
                this.modalService.showSuccess('Prenotazione cancellata con successo!');
                this.modalRef?.close();
                this.selectedBooking = undefined;
                // Ricarica le postazioni per aggiornare la mappa
                this.showMyBookingOnly = false
                this.loadDesks();
            },
            error: (error) => {
                console.error('Errore nella cancellazione:', error);
                this.showMyBookingOnly = false
                this.modalService.showError(error?.message || 'Errore durante la cancellazione della prenotazione');
            }
        });
    }


    isCurrentUserBooking(): boolean {
        if (!this.selectedBooking || !this.currentUserId) {
            return false;
        }
        return this.selectedBooking.userId === this.currentUserId;
    }

    buildDeskPositions(availableDesks: Desk[], bookings: Booking[]): void {
        if (!this.floor) return;

        const layout = this.floorLayouts[this.floor.floorNumber] || {};
        this.deskPositions = [];

        this.hasUserBookingForToday = false;

        this.desks.forEach(desk => {
            const position = layout[desk.deskNumber] || this.getDefaultPosition(desk.deskNumber);
            const isAvailable = availableDesks.some(d => d.id === desk.id);
            const booking = bookings.find(b => b.deskId === desk.id);
            const bookedByCurrentUser = booking?.userId === this.currentUserId;

            if (bookedByCurrentUser) {
                this.hasUserBookingForToday = true;
            }

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

    // Aggiungi metodo per verificare se l'utente è di tipo USER
    isRegularUser(): boolean {
        const currentUser = this.authService.currentUserValue;
        return currentUser?.role === 'USER';
    }

    getFilteredDeskPositions(): DeskPosition[] {
        if (!this.showMyBookingOnly) {
            return this.deskPositions.filter(dp => this.matchesSearchFilter(dp));
        }

        return this.deskPositions.filter(dp =>
            dp.bookedByCurrentUser && this.matchesSearchFilter(dp)
        );
    }

    toggleMyBookingFilter(): void {
        // Non serve più invertire il valore, [(ngModel)] lo fa automaticamente
        // Questo metodo può essere usato per eventuali azioni aggiuntive quando il filtro cambia
        console.log('Filtro "Mostra solo la tua prenotazione":', this.showMyBookingOnly);
    }

    shouldShowMyBookingSwitch(): boolean {
        return this.isRegularUser() && this.hasUserBookingForToday;
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
                this.modalService.showInfo('Hai già prenotato questa postazione per questa data!');
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
        this.modalRef = this.modalServiceNgb.open(this.confirmModal, {
            centered: true
        });
    }

    openModifyModal(): void {
        this.modalRef = this.modalServiceNgb.open(this.modifyModal, {
            centered: true
        });
    }

    openUserInfoModal(): void {
        this.modalRef = this.modalServiceNgb.open(this.userInfoModal, {
            centered: true
        });
    }

    confirmBooking(): void {
        if (!this.selectedDesk || !this.selectedDate) return;

        if (!this.authService.isAuthenticated) {
            this.modalService.showWarning('Devi essere autenticato per prenotare una postazione');
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
                this.modalService.showSuccess('Prenotazione effettuata con successo!');
                this.modalRef?.close();
                this.loadDesks();
            },
            error: (error) => {
                console.error('Errore prenotazione:', error);
                this.modalService.showError(error?.message || 'Errore durante la prenotazione');
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
                        this.modalService.showSuccess('Prenotazione modificata con successo!');
                        this.modalRef?.close();
                        this.existingBooking = undefined;
                        this.loadDesks();
                    },
                    error: (error) => {
                        console.error('Errore nella creazione della nuova prenotazione:', error);
                        this.modalService.showError(error?.message || 'Errore nella creazione della nuova prenotazione');
                    }
                });
            },
            error: (error) => {
                console.error('Errore nella cancellazione della prenotazione precedente:', error);
                this.modalService.showError(error?.message || 'Errore nella cancellazione della prenotazione precedente');
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
            return `Postazione ${deskPosition.desk.deskNumber} - La tua prenotazione`;
        }
        if (!deskPosition.available && deskPosition.booking) {
            return `Postazione ${deskPosition.desk.deskNumber} - Occupata da ${deskPosition.booking.userName}`;
        }
        if (deskPosition.available) {
            return `Postazione ${deskPosition.desk.deskNumber} - Disponibile`;
        }
        return `Postazione ${deskPosition.desk.deskNumber}`;
    }

    // Search Filter Method
    matchesSearchFilter(deskPosition: DeskPosition): boolean {
        if (!this.searchFilter || this.searchFilter.trim() === '') {
            return true;
        }

        const searchTerm = this.searchFilter.trim().toLowerCase();


        const notes = deskPosition.desk.notes?.toLowerCase() || '';

        const userName = deskPosition.booking?.userName?.toLowerCase() || '';

        return notes.includes(searchTerm) || userName.includes(searchTerm);
    }

    clearSearch(): void {
        this.searchFilter = '';
    }

    onSearchChange(): void {
        // Metodo chiamato quando il filtro di ricerca cambia
        // Non è necessario fare nulla qui perché il filtro viene applicato automaticamente
        // tramite matchesSearchFilter() nel template
    }

    // Zoom Methods
    zoomIn(): void {
        this.zoomToPoint(0.2);
    }

    zoomOut(): void {
        this.zoomToPoint(-0.2);
    }

    private zoomToPoint(delta: number): void {
        const oldZoom = this.zoomLevel;
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, oldZoom + delta));

        if (newZoom === oldZoom) return;

        // Ottieni il contenitore SVG per calcolare le coordinate relative
        if (!this.svgElement?.nativeElement) {
            this.zoomLevel = newZoom;
            return;
        }

        const svg = this.svgElement.nativeElement;
        const rect = svg.getBoundingClientRect();

        // Usa la posizione del mouse se disponibile, altrimenti usa il centro
        const clientX = this.lastMouseX || rect.left + rect.width / 2;
        const clientY = this.lastMouseY || rect.top + rect.height / 2;

        // Calcola il punto relativo al contenitore
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Calcola il punto nello spazio pre-zoom
        const pointX = (x - this.panX) / oldZoom;
        const pointY = (y - this.panY) / oldZoom;

        // Aggiorna lo zoom
        this.zoomLevel = newZoom;

        // Calcola il nuovo pan per mantenere il punto sotto il cursore
        this.panX = x - pointX * newZoom;
        this.panY = y - pointY * newZoom;
    }

    resetZoom(): void {
        this.zoomLevel = 1;
        this.panX = 0;
        this.panY = 0;
    }

// Modifica getTransform() per includere anche il pan
    getTransform(): string {
        return `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
    }

    getViewBox(): string {
        return `0 0 ${this.viewBoxWidth} ${this.viewBoxHeight}`;
    }

    // Wheel Zoom
    onWheel(event: WheelEvent): void {
        event.preventDefault();

        if (!this.svgElement?.nativeElement) return;

        const svg = this.svgElement.nativeElement;
        const rect = svg.getBoundingClientRect();

        // Calcola il punto del mouse relativo all'SVG
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const oldZoom = this.zoomLevel;
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, oldZoom + delta));

        if (newZoom === oldZoom) return;

        // Calcola il punto nello spazio pre-zoom
        const pointX = (x - this.panX) / oldZoom;
        const pointY = (y - this.panY) / oldZoom;

        // Aggiorna lo zoom
        this.zoomLevel = newZoom;

        // Calcola il nuovo pan per mantenere il punto sotto il cursore
        this.panX = x - pointX * newZoom;
        this.panY = y - pointY * newZoom;
    }

    // Touch Events
    onTouchStart(event: TouchEvent): void {
        if (event.touches.length === 2) {
            event.preventDefault();
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            this.lastTouchDistance = this.getTouchDistance(touch1, touch2);
            this.lastTouchCenter = this.getTouchCenter(touch1, touch2);
        } else if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.isPanning = true;
            this.startPanX = touch.clientX - this.viewBoxX;
            this.startPanY = touch.clientY - this.viewBoxY;
        }
    }

    onTouchMove(event: TouchEvent): void {
        if (event.touches.length === 2) {
            // ... logica pinch zoom esistente ...
        } else if (event.touches.length === 1 && this.isPanning) {
            event.preventDefault();
            const touch = event.touches[0];
            this.panX = touch.clientX - this.startPanX;
            this.panY = touch.clientY - this.startPanY;
        }
    }

    onTouchEnd(event: TouchEvent): void {
        if (event.touches.length < 2) {
            this.lastTouchDistance = 0;
        }
        if (event.touches.length === 0) {
            this.isPanning = false;
        }
    }

    // Mouse Events
    onMouseDown(event: MouseEvent): void {
        if (this.zoomLevel > 1) {
            this.isPanning = true;
            this.startPanX = event.clientX - this.panX;
            this.startPanY = event.clientY - this.panY;
            event.preventDefault();
        }
    }

    onMouseMove(event: MouseEvent): void {
        if (this.isPanning && this.zoomLevel > 1) {
            this.panX = event.clientX - this.startPanX;
            this.panY = event.clientY - this.startPanY;
            event.preventDefault();
        }
    }

    onMouseUp(): void {
        this.isPanning = false;
    }

    onMouseLeave(): void {
        this.isPanning = false;
    }

    // Touch Helper Methods
    private getTouchDistance(touch1: Touch, touch2: Touch): number {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private getTouchCenter(touch1: Touch, touch2: Touch): { x: number; y: number } {
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    }

    setupZoomListeners(): void {
        // Additional setup if needed
    }

    // Format Date Helper
    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Default Position Helper
    private getDefaultPosition(deskNumber: string): { x: number; y: number } {
        // Fallback position based on desk number
        const num = parseInt(deskNumber.replace(/\D/g, '')) || 0;
        return {
            x: 100 + (num % 10) * 50,
            y: 100 + Math.floor(num / 10) * 50
        };
    }

    // ============================================================================
    // LAYOUT PIANO 1 - 74 POSTAZIONI
    // ViewBox: 1200x848 (aspect ratio 1.414 - CORRETTO)
    // Formula: svgX = (x_px / 3509) * 1200, svgY = (y_px / 2481) * 848
    // ============================================================================
    private generateFloor1Layout(): { [deskNumber: string]: { x: number; y: number } } {
        const layout: { [deskNumber: string]: { x: number; y: number } } = {};

        layout['1'] = {x: 635.3, y: 101.5};
        layout['2'] = {x: 635.3, y: 132.0};
        layout['3'] = {x: 658.0, y: 101.5};
        layout['4'] = {x: 658.0, y: 132.0};
        layout['5'] = {x: 721.1, y: 101.5};
        layout['6'] = {x: 721.1, y: 132.0};
        layout['7'] = {x: 744.5, y: 101.5};
        layout['8'] = {x: 744.5, y: 132.0};
        layout['9'] = {x: 803.8, y: 101.5};
        layout['10'] = {x: 803.8, y: 132.0};
        layout['11'] = {x: 827.6, y: 101.5};
        layout['12'] = {x: 827.6, y: 132.0};
        layout['13'] = {x: 884.0, y: 101.5};
        layout['14'] = {x: 884.0, y: 132.0};
        layout['15'] = {x: 909.6, y: 101.5};
        layout['16'] = {x: 909.6, y: 132.0};
        layout['17'] = {x: 948.2, y: 277.6};
        layout['18'] = {x: 980.6, y: 277.6};
        layout['19'] = {x: 1013.1, y: 277.6};
        layout['20'] = {x: 948.2, y: 302.3};
        layout['21'] = {x: 980.6, y: 301.4};
        layout['22'] = {x: 1013.1, y: 302.3};
        layout['23'] = {x: 948.2, y: 366.8};
        layout['24'] = {x: 980.6, y: 366.8};
        layout['25'] = {x: 1013.1, y: 366.8};
        layout['26'] = {x: 948.2, y: 391.4};
        layout['27'] = {x: 980.6, y: 391.4};
        layout['28'] = {x: 1013.1, y: 391.4};
        layout['29'] = {x: 980.6, y: 457.2};
        layout['30'] = {x: 1013.1, y: 457.2};
        layout['31'] = {x: 980.6, y: 481.9};
        layout['32'] = {x: 1013.1, y: 481.9};
        layout['33'] = {x: 980.6, y: 541.6};
        layout['34'] = {x: 1013.1, y: 541.6};
        layout['35'] = {x: 980.6, y: 566.5};
        layout['36'] = {x: 1013.1, y: 566.5};
        layout['37'] = {x: 980.6, y: 631.7};
        layout['38'] = {x: 1013.1, y: 631.7};
        layout['39'] = {x: 980.6, y: 657.2};
        layout['40'] = {x: 1013.1, y: 657.2};
        layout['41'] = {x: 885.1, y: 740.9};
        layout['42'] = {x: 885.1, y: 773.4};
        layout['43'] = {x: 846.3, y: 740.9};
        layout['44'] = {x: 846.3, y: 773.4};
        layout['45'] = {x: 823.8, y: 740.9};
        layout['46'] = {x: 825.6, y: 773.4};
        layout['47'] = {x: 763.4, y: 740.9};
        layout['48'] = {x: 761.6, y: 773.4};
        layout['49'] = {x: 743.6, y: 740.9};
        layout['50'] = {x: 743.6, y: 773.4};
        layout['51'] = {x: 678.7, y: 740.9};
        layout['52'] = {x: 679.6, y: 773.4};
        layout['53'] = {x: 659.8, y: 740.9};
        layout['54'] = {x: 659.8, y: 773.4};
        layout['55'] = {x: 534.5, y: 657.2};
        layout['56'] = {x: 567.0, y: 657.2};
        layout['57'] = {x: 534.5, y: 631.5};
        layout['58'] = {x: 567.0, y: 631.5};
        layout['59'] = {x: 534.5, y: 566.5};
        layout['60'] = {x: 567.0, y: 566.5};
        layout['61'] = {x: 534.5, y: 541.6};
        layout['62'] = {x: 567.0, y: 541.6};
        layout['63'] = {x: 534.5, y: 472.5};
        layout['64'] = {x: 567.0, y: 472.5};
        layout['65'] = {x: 534.5, y: 447.9};
        layout['66'] = {x: 567.0, y: 447.9};
        layout['67'] = {x: 534.5, y: 384.4};
        layout['68'] = {x: 567.0, y: 384.3};
        layout['69'] = {x: 534.5, y: 359.5};
        layout['70'] = {x: 567.0, y: 359.5};
        layout['71'] = {x: 534.5, y: 294.1};
        layout['72'] = {x: 567.0, y: 294.1};
        layout['73'] = {x: 534.5, y: 270.3};
        layout['74'] = {x: 567.0, y: 270.4};

        return layout;
    }

    // ============================================================================
    // LAYOUT PIANO 3 - 40 POSTAZIONI
    // ViewBox: 1200x848
    // ============================================================================
    private generateFloor3Layout(): { [deskNumber: string]: { x: number; y: number } } {
        const layout: { [deskNumber: string]: { x: number; y: number } } = {};

        layout['1'] = {x: 541.4, y: 92.1};
        layout['2'] = {x: 541.4, y: 126.6};
        layout['3'] = {x: 567.7, y: 92.1};
        layout['4'] = {x: 567.4, y: 126.6};
        layout['5'] = {x: 621.5, y: 92.1};
        layout['6'] = {x: 621.5, y: 126.6};
        layout['7'] = {x: 648.1, y: 92.1};
        layout['8'] = {x: 646.3, y: 126.6};
        layout['9'] = {x: 706.7, y: 92.1};
        layout['10'] = {x: 706.7, y: 126.6};
        layout['11'] = {x: 731.3, y: 92.1};
        layout['12'] = {x: 731.3, y: 126.6};
        layout['13'] = {x: 788.3, y: 92.1};
        layout['14'] = {x: 788.3, y: 126.6};
        layout['15'] = {x: 813.9, y: 92.1};
        layout['16'] = {x: 812.1, y: 126.6};
        layout['17'] = {x: 850.9, y: 267.5};
        layout['18'] = {x: 884.2, y: 267.5};
        layout['19'] = {x: 915.7, y: 267.5};
        layout['20'] = {x: 850.9, y: 293.2};
        layout['21'] = {x: 884.2, y: 293.2};
        layout['22'] = {x: 915.7, y: 293.2};
        layout['23'] = {x: 850.9, y: 357.6};
        layout['24'] = {x: 884.2, y: 357.6};
        layout['25'] = {x: 915.7, y: 357.6};
        layout['26'] = {x: 850.9, y: 381.5};
        layout['27'] = {x: 884.2, y: 381.5};
        layout['28'] = {x: 915.7, y: 381.5};
        layout['29'] = {x: 850.9, y: 442.2};
        layout['30'] = {x: 884.2, y: 442.2};
        layout['31'] = {x: 915.7, y: 442.2};
        layout['32'] = {x: 850.9, y: 472.0};
        layout['33'] = {x: 884.2, y: 472.0};
        layout['34'] = {x: 915.7, y: 472.0};
        layout['35'] = {x: 876.9, y: 530.8};
        layout['36'] = {x: 910.3, y: 530.8};
        layout['37'] = {x: 876.9, y: 556.5};
        layout['38'] = {x: 910.3, y: 556.5};
        layout['39'] = {x: 876.9, y: 620.2};
        layout['40'] = {x: 910.3, y: 620.2};
        layout['41'] = {x: 876.9, y: 644.6};
        layout['42'] = {x: 910.3, y: 644.6};
        layout['43'] = {x: 897.7, y: 696.8};
        layout['44'] = {x: 896.8, y: 728.3};
        layout['45'] = {x: 895.9, y: 761.7};
        layout['46'] = {x: 870.9, y: 696.8};
        layout['47'] = {x: 870.9, y: 728.3};
        layout['48'] = {x: 870.9, y: 761.7};
        layout['49'] = {x: 807.6, y: 722.9};
        layout['50'] = {x: 807.6, y: 755.4};
        layout['51'] = {x: 781.3, y: 722.9};
        layout['52'] = {x: 781.3, y: 755.4};
        layout['53'] = {x: 554.6, y: 722.9};
        layout['54'] = {x: 554.6, y: 755.4};
        layout['55'] = {x: 528.7, y: 722.9};
        layout['56'] = {x: 528.7, y: 755.4};
        layout['57'] = {x: 468.9, y: 695.9};
        layout['58'] = {x: 468.9, y: 730.1};
        layout['59'] = {x: 468.9, y: 760.8};
        layout['60'] = {x: 442.3, y: 695.9};
        layout['61'] = {x: 442.3, y: 730.1};
        layout['62'] = {x: 442.3, y: 760.8};
        layout['63'] = {x: 438.1, y: 644.6};
        layout['64'] = {x: 472.3, y: 644.6};
        layout['65'] = {x: 438.1, y: 620.2};
        layout['66'] = {x: 472.3, y: 620.2};
        layout['67'] = {x: 438.1, y: 556.5};
        layout['68'] = {x: 472.3, y: 556.5};
        layout['69'] = {x: 502.1, y: 556.5};
        layout['70'] = {x: 438.1, y: 530.8};
        layout['71'] = {x: 472.3, y: 530.8};
        layout['72'] = {x: 502.1, y: 530.8};
        layout['73'] = {x: 438.1, y: 472.0};
        layout['74'] = {x: 472.3, y: 472.0};
        layout['75'] = {x: 438.1, y: 445.5};
        layout['76'] = {x: 472.3, y: 445.5};
        layout['77'] = {x: 438.1, y: 377.4};
        layout['78'] = {x: 472.3, y: 377.4};
        layout['79'] = {x: 438.1, y: 352.7};
        layout['80'] = {x: 472.3, y: 352.7};

        return layout;

    }
}
