import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateSelectorComponent } from '../../components/date-selector/date-selector.component';
import { FloorSelectorComponent } from '../../components/floor-selector/floor-selector.component';
import { FloorMapComponent } from '../../components/floor-map/floor-map.component';
import { Floor } from '../../models/floor.model';

@Component({
  selector: 'app-booking-page',
  standalone: true,
  imports: [
    CommonModule,
    DateSelectorComponent,
    FloorSelectorComponent,
    FloorMapComponent
  ],
  templateUrl: './booking-page.component.html',
  styleUrls: ['./booking-page.component.scss']
})
export class BookingPageComponent {
  selectedDate?: Date;
  selectedFloor?: Floor;

  onDateSelected(date: Date): void {
    this.selectedDate = date;
    console.log('Data selezionata:', date);
  }

  onFloorSelected(floor: Floor): void {
    this.selectedFloor = floor;
    console.log('Piano selezionato:', floor);
  }
}
