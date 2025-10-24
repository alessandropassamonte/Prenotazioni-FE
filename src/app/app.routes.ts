import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { BookingPageComponent } from './pages/booking-page/booking-page.component';
import { MyBookingsPageComponent } from './pages/my-bookings-page/my-bookings-page.component';
import {LoginComponent} from "./components/login/login.component";

export const routes: Routes = [
    { path: 'login', component: LoginComponent },

  {
    path: '',
    component: HomePageComponent,
    title: 'Home - Desk Booking System'
  },
  {
    path: 'booking',
    component: BookingPageComponent,
    title: 'Prenota Postazione - Desk Booking System'
  },
  {
    path: 'my-bookings',
    component: MyBookingsPageComponent,
    title: 'Le Mie Prenotazioni - Desk Booking System'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
