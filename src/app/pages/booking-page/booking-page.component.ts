import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
export class BookingPageComponent implements OnInit {
    selectedDate?: Date;
    selectedFloor?: Floor;
    preselectedDate?: Date;

    constructor(private route: ActivatedRoute) {}

    ngOnInit(): void {
        // Leggi la data dai query params se presente
        this.route.queryParams.subscribe(params => {
            if (params['date']) {
                const dateString = params['date'];
                this.preselectedDate = new Date(dateString);
                this.selectedDate = this.preselectedDate;
                console.log('Data preselezionata da calendario:', this.preselectedDate);
            }
        });
    }

    onDateSelected(date: Date): void {
        this.selectedDate = date;
        console.log('Data selezionata:', date);
    }

    onFloorSelected(floor: Floor): void {
        this.selectedFloor = floor;
        console.log('Piano selezionato:', floor);
    }
}
