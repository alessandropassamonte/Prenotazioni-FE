import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDatepickerModule, NgbDateStruct, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { CompanyHolidayService } from '../../services/company-holiday.service';
import { CompanyHoliday } from '../../models/company-holiday.model';
import { Injectable } from '@angular/core';

@Injectable()
export class CustomDateParserFormatter extends NgbDateParserFormatter {
    readonly DELIMITER = '/';

    parse(value: string): NgbDateStruct | null {
        if (value) {
            const date = value.split(this.DELIMITER);
            return {
                day: parseInt(date[0], 10),
                month: parseInt(date[1], 10),
                year: parseInt(date[2], 10),
            };
        }
        return null;
    }

    format(date: NgbDateStruct | null): string {
        if (!date) return '';
        return `${this.pad(date.day)}/${this.pad(date.month)}/${date.year}`;
    }

    private pad(n: number): string {
        return n < 10 ? `0${n}` : `${n}`;
    }
}

@Component({
    selector: 'app-date-selector',
    standalone: true,
    imports: [CommonModule, FormsModule, NgbDatepickerModule],
    templateUrl: './date-selector.component.html',
    styleUrls: ['./date-selector.component.scss'],
    providers: [{ provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }]
})
export class DateSelectorComponent implements OnInit {
    @Output() dateSelected = new EventEmitter<Date>();

    selectedDate: NgbDateStruct;
    minDate: NgbDateStruct;
    maxDate: NgbDateStruct;
    holidays: CompanyHoliday[] = []; // Festività caricate dal backend
    loadingHolidays = false;
    private readonly WORKING_DAYS_LIMIT = 7; // Numero di giorni lavorativi da mostrare

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

        // Max date temporaneo - sarà ricalcolato dopo aver caricato le festività
        const tempMaxDateObj = new Date();
        tempMaxDateObj.setDate(tempMaxDateObj.getDate() + 30); // Range temporaneo ampio
        this.maxDate = {
            year: tempMaxDateObj.getFullYear(),
            month: tempMaxDateObj.getMonth() + 1,
            day: tempMaxDateObj.getDate()
        };
    }

    ngOnInit(): void {
        // Carica le festività e poi calcola il max date
        this.loadHolidays();

        // Emetti la data corrente all'inizializzazione per preselezionarla
        const today = new Date(this.selectedDate.year, this.selectedDate.month - 1, this.selectedDate.day);
        this.dateSelected.emit(today);
    }

    loadHolidays(): void {
        this.loadingHolidays = true;

        // Calcola range: da oggi a 30 giorni (per essere sicuri di coprire 7 giorni lavorativi)
        const startDate = this.formatDate(new Date(this.minDate.year, this.minDate.month - 1, this.minDate.day));
        const tempEndDate = new Date();
        tempEndDate.setDate(tempEndDate.getDate() + 30);
        const endDate = this.formatDate(tempEndDate);

        this.holidayService.getHolidaysBetween(startDate, endDate).subscribe({
            next: (holidays) => {
                this.holidays = holidays;
                this.loadingHolidays = false;
                console.log('Festività caricate:', this.holidays.length);

                // Ricalcola il max date basandosi sui giorni lavorativi
                this.calculateMaxDate();
            },
            error: (error) => {
                console.error('Errore caricamento festività:', error);
                this.loadingHolidays = false;
                // Continua senza festività in caso di errore
                this.holidays = [];

                // Ricalcola il max date anche in caso di errore
                this.calculateMaxDate();
            }
        });
    }

    /**
     * Calcola il max date come 7 giorni lavorativi dalla data corrente
     */
    private calculateMaxDate(): void {
        const startDate = new Date(this.minDate.year, this.minDate.month - 1, this.minDate.day);
        let workingDaysCount = 0;
        let currentDate = new Date(startDate);

        // Continua ad aggiungere giorni finché non raggiungiamo 7 giorni lavorativi
        while (workingDaysCount < this.WORKING_DAYS_LIMIT) {
            // Verifica se il giorno corrente è lavorativo
            if (!this.isWeekend(currentDate) && !this.isHoliday(currentDate)) {
                workingDaysCount++;
            }

            // Se non abbiamo ancora raggiunto 7 giorni lavorativi, vai al giorno successivo
            if (workingDaysCount < this.WORKING_DAYS_LIMIT) {
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        // Imposta il max date
        this.maxDate = {
            year: currentDate.getFullYear(),
            month: currentDate.getMonth() + 1,
            day: currentDate.getDate()
        };

        console.log('Max date calcolato (7 giorni lavorativi):', this.formatDate(currentDate));
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

        return this.holidays.some(h => {
            // Se la festività è ricorrente, confronta solo giorno e mese
            if (h.recurring) {
                const holidayDate = new Date(h.date);
                return date.getMonth() === holidayDate.getMonth() &&
                    date.getDate() === holidayDate.getDate();
            }

            // Altrimenti confronta la data completa
            return h.date === dateString;
        });
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
