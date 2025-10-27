import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Floor } from '../../models/floor.model';
import { FloorService } from '../../services/floor.service';

@Component({
  selector: 'app-floor-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floor-selector.component.html',
  styleUrls: ['./floor-selector.component.scss']
})
export class FloorSelectorComponent implements OnInit {
  @Input() selectedDate?: Date;
  @Input() preselectedFloorId?: number;
  @Output() floorSelected = new EventEmitter<Floor>();
  
  floors: Floor[] = [];
  selectedFloor?: Floor;
  loading = false;

  constructor(private floorService: FloorService) {}

  ngOnInit(): void {
    this.loadFloors();
  }

  loadFloors(): void {
    this.loading = true;
    this.floorService.getAllActiveFloors().subscribe({
      next: (floors) => {
        this.floors = floors.sort((a, b) => a.floorNumber - b.floorNumber);
        this.loading = false;
        
        // Seleziona il piano preselezionato se presente, altrimenti il primo
        if (this.preselectedFloorId) {
          const preselectedFloor = this.floors.find(f => f.id === this.preselectedFloorId);
          if (preselectedFloor) {
            this.selectFloor(preselectedFloor);
          } else if (this.floors.length > 0) {
            this.selectFloor(this.floors[0]);
          }
        } else if (this.floors.length > 0) {
          this.selectFloor(this.floors[0]);
        }
      },
      error: (error) => {
        console.error('Errore nel caricamento dei piani:', error);
        this.loading = false;
      }
    });
  }

  selectFloor(floor: Floor): void {
    this.selectedFloor = floor;
    this.floorSelected.emit(floor);
  }

  isSelected(floor: Floor): boolean {
    return this.selectedFloor?.id === floor.id;
  }
}
