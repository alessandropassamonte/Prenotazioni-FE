import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyHoliday, CreateCompanyHolidayRequest, HolidayType, HolidayTypeLabels } from '../../models/company-holiday.model';
import { CompanyHolidayService } from '../../services/company-holiday.service';
import { ModalService } from '../../services/modal.service';
import { NgbModal, NgbModalRef, NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-holidays-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, NgbDatepickerModule],
    templateUrl: './holidays-admin.component.html',
    styleUrls: ['./holidays-admin.component.scss']
})
export class HolidaysAdminComponent implements OnInit {
    @ViewChild('holidayModal') holidayModal?: TemplateRef<any>;

    holidays: CompanyHoliday[] = []; // Festività dell'anno correntemente selezionato
    loading = false;
    modalRef?: NgbModalRef;

    // Form data
    isEditMode = false;
    currentHolidayId?: number;
    holidayForm: CreateCompanyHolidayRequest = {
        date: '',
        name: '',
        description: '',
        type: HolidayType.FESTIVITY,
        recurring: false
    };

    // Datepicker
    selectedDate?: NgbDateStruct;

    // Filtri
    filterYear: number = new Date().getFullYear();
    availableYears: number[] = [];

    // Enum per template
    HolidayType = HolidayType;
    HolidayTypeLabels = HolidayTypeLabels;
    holidayTypes = Object.values(HolidayType);

    constructor(
        private holidayService: CompanyHolidayService,
        private modalService: ModalService,
        private ngbModalService: NgbModal
    ) {
        // Genera anni per filtro (anno corrente ± 2 anni)
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 1; i <= currentYear + 3; i++) {
            this.availableYears.push(i);
        }
    }

    ngOnInit(): void {
        this.loadHolidays();
    }

    /**
     * Carica le festività per l'anno selezionato
     * Il backend genera automaticamente le festività ricorrenti se mancanti
     */
    loadHolidays(): void {
        this.loading = true;
        this.holidayService.getHolidaysByYear(this.filterYear).subscribe({
            next: (holidays) => {
                this.holidays = holidays; // Già ordinate dal backend
                this.loading = false;
                console.log(`Caricate ${holidays.length} festività per l'anno ${this.filterYear}`);
            },
            error: (error) => {
                console.error('Errore nel caricamento delle festività:', error);
                this.loading = false;
                this.modalService.showError('Errore nel caricamento delle festività');
            }
        });
    }

    /**
     * Chiamato quando l'utente cambia l'anno nel select
     * Effettua una nuova chiamata REST per l'anno selezionato
     */
    onYearChange(): void {
        console.log(`Anno modificato a: ${this.filterYear}. Ricaricamento festività...`);
        this.loadHolidays();
    }

    openCreateModal(): void {
        this.isEditMode = false;
        this.currentHolidayId = undefined;
        this.holidayForm = {
            date: '',
            name: '',
            description: '',
            type: HolidayType.FESTIVITY,
            recurring: false
        };
        this.selectedDate = undefined;
        this.modalRef = this.ngbModalService.open(this.holidayModal, { centered: true, size: 'lg' });
    }

    openEditModal(holiday: CompanyHoliday): void {
        this.isEditMode = true;
        this.currentHolidayId = holiday.id;

        this.holidayForm = {
            date: holiday.date,
            name: holiday.name,
            description: holiday.description || '',
            type: holiday.type as HolidayType,
            recurring: holiday.recurring
        };

        // Imposta datepicker
        const date = new Date(holiday.date);
        this.selectedDate = {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate()
        };

        this.modalRef = this.ngbModalService.open(this.holidayModal, { centered: true, size: 'lg' });
    }

    saveHoliday(): void {
        // Converti NgbDateStruct in string ISO
        if (this.selectedDate) {
            const { year, month, day } = this.selectedDate;
            this.holidayForm.date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }

        if (!this.holidayForm.date || !this.holidayForm.name) {
            this.modalService.showError('Compila tutti i campi obbligatori');
            return;
        }

        if (this.isEditMode && this.currentHolidayId) {
            // Aggiorna esistente
            this.holidayService.updateHoliday(this.currentHolidayId, this.holidayForm).subscribe({
                next: () => {
                    this.modalService.showSuccess('Festività aggiornata con successo');
                    this.closeModal();
                    this.loadHolidays();
                },
                error: (error) => {
                    console.error('Errore aggiornamento:', error);
                    this.modalService.showError('Errore nell\'aggiornamento della festività');
                }
            });
        } else {
            // Crea nuova
            this.holidayService.createHoliday(this.holidayForm).subscribe({
                next: () => {
                    this.modalService.showSuccess('Festività creata con successo');
                    this.closeModal();
                    this.loadHolidays();
                },
                error: (error) => {
                    console.error('Errore creazione:', error);
                    this.modalService.showError(
                        error.error?.message || 'Errore nella creazione della festività'
                    );
                }
            });
        }
    }

    deleteHoliday(holiday: CompanyHoliday): void {
        if (!confirm(`Sei sicuro di voler eliminare "${holiday.name}"?`)) {
            return;
        }

        this.holidayService.deleteHoliday(holiday.id).subscribe({
            next: () => {
                this.modalService.showSuccess('Festività eliminata con successo');
                this.loadHolidays();
            },
            error: (error) => {
                console.error('Errore eliminazione:', error);
                this.modalService.showError('Errore nell\'eliminazione della festività');
            }
        });
    }

    closeModal(): void {
        this.modalRef?.close();
    }

    onDateSelect(date: NgbDateStruct): void {
        this.selectedDate = date;
    }

    formatDisplayDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString('it-IT', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    getTypeIcon(type: string): string {
        const icons: { [key: string]: string } = {
            'FESTIVITY': 'bi-calendar-event',
            'COMPANY_CLOSURE': 'bi-building-x',
            'MAINTENANCE': 'bi-tools',
            'OTHER': 'bi-info-circle'
        };
        return icons[type] || 'bi-calendar-x';
    }

    getTypeBadgeClass(type: string): string {
        const classes: { [key: string]: string } = {
            'FESTIVITY': 'bg-danger',
            'COMPANY_CLOSURE': 'bg-warning',
            'MAINTENANCE': 'bg-info',
            'OTHER': 'bg-secondary'
        };
        return classes[type] || 'bg-secondary';
    }
}
