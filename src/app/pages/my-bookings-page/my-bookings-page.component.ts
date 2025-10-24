import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingListComponent } from '../../components/booking-list/booking-list.component';

@Component({
  selector: 'app-my-bookings-page',
  standalone: true,
  imports: [CommonModule, BookingListComponent],
  templateUrl: './my-bookings-page.component.html',
  styleUrls: ['./my-bookings-page.component.scss']
})
export class MyBookingsPageComponent {}
