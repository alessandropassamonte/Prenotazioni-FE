import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DateSelectorComponent } from '../../components/date-selector/date-selector.component';
import { FloorSelectorComponent } from '../../components/floor-selector/floor-selector.component';
import { FloorMapComponent } from '../../components/floor-map/floor-map.component';
import { Floor } from '../../models/floor.model';
import { FloorService } from '../../services/floor.service';

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
    preselectedFloorId?: number;
    preselectedBookingId?: number;

    constructor(
        private route: ActivatedRoute,
        private floorService: FloorService
    ) {}

    ngOnInit(): void {
        // Leggi i parametri dai query params
        this.route.queryParams.subscribe(params => {
            if (params['date']) {
                const dateString = params['date'];
                this.preselectedDate = new Date(dateString);
                this.selectedDate = this.preselectedDate;
                console.log('Data preselezionata da calendario:', this.preselectedDate);
            }

            if (params['floorId']) {
                this.preselectedFloorId = parseInt(params['floorId'], 10);
                console.log('Piano preselezionato:', this.preselectedFloorId);
                // Carica il piano e selezionalo automaticamente
                this.loadAndSelectFloor(this.preselectedFloorId);
            }

            if (params['bookingId']) {
                this.preselectedBookingId = parseInt(params['bookingId'], 10);
                console.log('ID prenotazione esistente:', this.preselectedBookingId);
            }
        });
    }

    loadAndSelectFloor(floorId: number): void {
        this.floorService.getFloorById(floorId).subscribe({
            next: (floor) => {
                this.selectedFloor = floor;
                console.log('Piano caricato e selezionato automaticamente:', floor);
            },
            error: (error) => {
                console.error('Errore nel caricamento del piano:', error);
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
