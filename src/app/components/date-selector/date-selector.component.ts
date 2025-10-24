import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-date-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDatepickerModule],
  templateUrl: './date-selector.component.html',
  styleUrls: ['./date-selector.component.scss']
})
export class DateSelectorComponent {
  @Output() dateSelected = new EventEmitter<Date>();
  
  selectedDate: NgbDateStruct;
  minDate: NgbDateStruct;
  maxDate: NgbDateStruct;

  constructor() {
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

  onDateChange(date: NgbDateStruct): void {
    if (date) {
      const jsDate = new Date(date.year, date.month - 1, date.day);
      this.dateSelected.emit(jsDate);
    }
  }

  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Domenica o Sabato
  }
}
