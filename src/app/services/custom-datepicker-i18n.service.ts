import { Injectable } from '@angular/core';
import { NgbDatepickerI18n, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

const I18N_VALUES: { [key: string]: any } = {
  it: {
    weekdays: ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'],
    months: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
    fullMonths: [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ]
  }
};

@Injectable()
export class CustomDatepickerI18n extends NgbDatepickerI18n {
  constructor() {
    super();
  }

  getWeekdayLabel(weekday: number): string {
    return I18N_VALUES['it'].weekdays[weekday - 1];
  }

  override getWeekLabel(): string {
    return 'Sett';
  }

  getMonthShortName(month: number): string {
    return I18N_VALUES['it'].months[month - 1];
  }

  getMonthFullName(month: number): string {
    return I18N_VALUES['it'].fullMonths[month - 1];
  }

  getDayAriaLabel(date: NgbDateStruct): string {
    return `${date.day}/${date.month}/${date.year}`;
  }
}

