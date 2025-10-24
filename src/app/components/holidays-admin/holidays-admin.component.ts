import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyHoliday, CreateCompanyHolidayRequest, HolidayType, HolidayTypeLabels } from '../../models/company-holiday.model';
import { CompanyHolidayService } from '../../services/company-holiday.service';
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
  
  holidays: CompanyHoliday[] = [];
  filteredHolidays: CompanyHoliday[] = [];
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
    private modalService: NgbModal
  ) {
    // Genera anni per filtro (anno corrente ± 2 anni)
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      this.availableYears.push(i);
    }
  }

  ngOnInit(): void {
    this.loadHolidays();
  }

  loadHolidays(): void {
    this.loading = true;
    this.holidayService.getAllHolidays().subscribe({
      next: (holidays) => {
        this.holidays = holidays.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        this.applyFilter();
        this.loading = false;
      },
      error: (error) => {
        console.error('Errore nel caricamento delle festività:', error);
        this.loading = false;
        alert('Errore nel caricamento delle festività');
      }
    });
  }

  applyFilter(): void {
    this.filteredHolidays = this.holidays.filter(h => {
      const holidayYear = new Date(h.date).getFullYear();
      return holidayYear === this.filterYear;
    });
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
    this.modalRef = this.modalService.open(this.holidayModal, { centered: true, size: 'lg' });
  }

  openEditModal(holiday: CompanyHoliday): void {
    this.isEditMode = true;
    this.currentHolidayId = holiday.id;
    const date = new Date(holiday.date);
    this.holidayForm = {
      date: holiday.date,
      name: holiday.name,
      description: holiday.description || '',
      type: holiday.type,
      recurring: holiday.recurring
    };
    this.selectedDate = {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
    this.modalRef = this.modalService.open(this.holidayModal, { centered: true, size: 'lg' });
  }

  onDateSelect(date: NgbDateStruct): void {
    const jsDate = new Date(date.year, date.month - 1, date.day);
    this.holidayForm.date = this.formatDate(jsDate);
  }

  saveHoliday(): void {
    if (!this.holidayForm.date || !this.holidayForm.name) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    if (this.isEditMode && this.currentHolidayId) {
      // Update
      this.holidayService.updateHoliday(this.currentHolidayId, this.holidayForm).subscribe({
        next: () => {
          alert('Festività aggiornata con successo');
          this.modalRef?.close();
          this.loadHolidays();
        },
        error: (error) => {
          console.error('Errore aggiornamento:', error);
          alert(error.error?.message || 'Errore durante l\'aggiornamento');
        }
      });
    } else {
      // Create
      this.holidayService.createHoliday(this.holidayForm).subscribe({
        next: () => {
          alert('Festività creata con successo');
          this.modalRef?.close();
          this.loadHolidays();
        },
        error: (error) => {
          console.error('Errore creazione:', error);
          alert(error.error?.message || 'Errore durante la creazione');
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
        alert('Festività eliminata con successo');
        this.loadHolidays();
      },
      error: (error) => {
        console.error('Errore eliminazione:', error);
        alert('Errore durante l\'eliminazione');
      }
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDisplayDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getTypeClass(type: HolidayType): string {
    switch (type) {
      case HolidayType.FESTIVITY:
        return 'badge bg-success';
      case HolidayType.COMPANY_CLOSURE:
        return 'badge bg-warning text-dark';
      case HolidayType.MAINTENANCE:
        return 'badge bg-info';
      default:
        return 'badge bg-secondary';
    }
  }

  closeModal(): void {
    this.modalRef?.close();
  }
}
