import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { CompanyHolidayService } from '../../services/company-holiday.service';
import { CompanyHoliday } from '../../models/company-holiday.model';

@Component({
    selector: 'app-date-selector',
    standalone: true,
    imports: [CommonModule, FormsModule, NgbDatepickerModule],
    templateUrl: './date-selector.component.html',
    styleUrls: ['./date-selector.component.scss']
})
export class DateSelectorComponent implements OnInit {
    @Output() dateSelected = new EventEmitter<Date>();

    selectedDate: NgbDateStruct;
    minDate: NgbDateStruct;
    maxDate: NgbDateStruct;
    holidays: CompanyHoliday[] = []; // Festività caricate dal backend
    loadingHolidays = false;

    constructor(private holidayService: CompanyHolidayService) {
        const today = new Date();

        // Imposta data corrente
        this.selectedDate = {
            year: today.getFullYear(),
            month: today.getMonth() + 1,
            day: today.getDate()
        };

        // Imposta min date (oggi)
        this.minDate = this.selectedDate;

        // Imposta max date a 3 mesi da oggi
        const maxDateObj = new Date();
        maxDateObj.setMonth(maxDateObj.getMonth() + 3);
        this.maxDate = {
            year: maxDateObj.getFullYear(),
            month: maxDateObj.getMonth() + 1,
            day: maxDateObj.getDate()
        };
    }

    ngOnInit(): void {
        // Carica le festività
        this.loadHolidays();

        // Emetti la data corrente all'inizializzazione per preselezionarla
        const today = new Date(this.selectedDate.year, this.selectedDate.month - 1, this.selectedDate.day);
        this.dateSelected.emit(today);
    }

    loadHolidays(): void {
        this.loadingHolidays = true;

        // Calcola range: da oggi a 3 mesi
        const startDate = this.formatDate(new Date(this.minDate.year, this.minDate.month - 1, this.minDate.day));
        const endDate = this.formatDate(new Date(this.maxDate.year, this.maxDate.month - 1, this.maxDate.day));

        this.holidayService.getHolidaysBetween(startDate, endDate).subscribe({
            next: (holidays) => {
                this.holidays = holidays;
                this.loadingHolidays = false;
                console.log('Festività caricate:', this.holidays.length);
            },
            error: (error) => {
                console.error('Errore caricamento festività:', error);
                this.loadingHolidays = false;
                // Continua senza festività in caso di errore
                this.holidays = [];
            }
        });
    }

    onDateChange(date: NgbDateStruct): void {
        if (date) {
            const jsDate = new Date(date.year, date.month - 1, date.day);
            this.dateSelected.emit(jsDate);
        }
    }

    /**
     * Funzione per disabilitare date nel datepicker
     */
    isDisabled = (date: NgbDateStruct): boolean => {
        const jsDate = new Date(date.year, date.month - 1, date.day);

        // Disabilita weekend
        if (this.isWeekend(jsDate)) {
            return true;
        }

        // Disabilita festività
        if (this.isHoliday(jsDate)) {
            return true;
        }

        return false;
    };

    /**
     * Verifica se una data è weekend
     */
    private isWeekend(date: Date): boolean {
        const day = date.getDay();
        return day === 0 || day === 6; // Domenica o Sabato
    }

    /**
     * Verifica se una data è una festività
     */
    private isHoliday(date: Date): boolean {
        const dateString = this.formatDate(date);
        return this.holidays.some(h => h.date === dateString);
    }

    /**
     * Formatta data in ISO format (YYYY-MM-DD)
     */
    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
