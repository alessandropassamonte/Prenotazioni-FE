import { Component, EventEmitter, Output, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
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
export class DateSelectorComponent implements OnInit, OnChanges {
    @Output() dateSelected = new EventEmitter<Date>();
    @Input() preselectedDate?: Date; // Data preselezionata da input

    selectedDate: NgbDateStruct;
    minDate: NgbDateStruct;
    maxDate: NgbDateStruct;
    holidays: CompanyHoliday[] = [];
    loadingHolidays = false;
    private readonly WORKING_DAYS_LIMIT = 7;

    constructor(private holidayService: CompanyHolidayService) {
        const today = new Date();

        this.selectedDate = {
            year: today.getFullYear(),
            month: today.getMonth() + 1,
            day: today.getDate()
        };

        this.minDate = this.selectedDate;

        const tempMaxDateObj = new Date();
        tempMaxDateObj.setDate(tempMaxDateObj.getDate() + 30);
        this.maxDate = {
            year: tempMaxDateObj.getFullYear(),
            month: tempMaxDateObj.getMonth() + 1,
            day: tempMaxDateObj.getDate()
        };
    }

    ngOnInit(): void {
        this.loadHolidays();
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Se la data preselezionata cambia, aggiorna la selezione
        if (changes['preselectedDate'] && this.preselectedDate) {
            this.selectedDate = {
                year: this.preselectedDate.getFullYear(),
                month: this.preselectedDate.getMonth() + 1,
                day: this.preselectedDate.getDate()
            };
            // Emetti la data preselezionata
            this.dateSelected.emit(this.preselectedDate);
        }
    }

    loadHolidays(): void {
        this.loadingHolidays = true;

        const startDate = this.formatDate(new Date(this.minDate.year, this.minDate.month - 1, this.minDate.day));
        const tempEndDate = new Date();
        tempEndDate.setDate(tempEndDate.getDate() + 30);
        const endDate = this.formatDate(tempEndDate);

        this.holidayService.getHolidaysBetween(startDate, endDate).subscribe({
            next: (holidays) => {
                this.holidays = holidays;
                this.loadingHolidays = false;
                console.log('Festività caricate:', this.holidays.length);
                this.calculateMaxDate();
                // Dopo aver caricato le festività, emetti la data odierna se è valida
                this.emitTodayIfValid();
            },
            error: (error) => {
                console.error('Errore caricamento festività:', error);
                this.loadingHolidays = false;
                this.holidays = [];
                this.calculateMaxDate();
                // Anche in caso di errore, emetti la data odierna se è valida
                this.emitTodayIfValid();
            }
        });
    }

    private emitTodayIfValid(): void {
        // Se non c'è una data preselezionata, controlla se oggi è valido
        if (!this.preselectedDate) {
            const today = new Date();
            const todayStruct: NgbDateStruct = {
                year: today.getFullYear(),
                month: today.getMonth() + 1,
                day: today.getDate()
            };

            // Verifica se oggi è un giorno lavorativo (non weekend e non festività)
            if (!this.isDisabled(todayStruct)) {
                console.log('Data odierna valida, emetto evento:', today);
                this.dateSelected.emit(today);
            } else {
                console.log('Data odierna non valida (weekend o festività)');
            }
        }
    }

    private calculateMaxDate(): void {
        const startDate = new Date(this.minDate.year, this.minDate.month - 1, this.minDate.day);
        let workingDaysCount = 0;
        let currentDate = new Date(startDate);

        while (workingDaysCount < this.WORKING_DAYS_LIMIT) {
            if (!this.isWeekend(currentDate) && !this.isHoliday(currentDate)) {
                workingDaysCount++;
            }

            if (workingDaysCount < this.WORKING_DAYS_LIMIT) {
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

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

    isDisabled = (date: NgbDateStruct): boolean => {
        const jsDate = new Date(date.year, date.month - 1, date.day);
        return this.isWeekend(jsDate) || this.isHoliday(jsDate);
    };

    private isWeekend(date: Date): boolean {
        const day = date.getDay();
        return day === 0 || day === 6;
    }

    private isHoliday(date: Date): boolean {
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

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
