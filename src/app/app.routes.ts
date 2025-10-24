import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { BookingPageComponent } from './pages/booking-page/booking-page.component';
import { MyBookingsPageComponent } from './pages/my-bookings-page/my-bookings-page.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    // Route pubbliche (senza autenticazione)
    {
        path: 'login',
        component: LoginComponent,
        title: 'Login - Desk Booking System'
    },
    {
        path: 'register',
        component: RegisterComponent,
        title: 'Registrazione - Desk Booking System'
    },

    // Route protette (richiedono autenticazione)
    {
        path: '',
        component: HomePageComponent,
        title: 'Home - Desk Booking System',
        canActivate: [AuthGuard]
    },
    {
        path: 'booking',
        component: BookingPageComponent,
        title: 'Prenota Postazione - Desk Booking System',
        canActivate: [AuthGuard]
    },
    {
        path: 'my-bookings',
        component: MyBookingsPageComponent,
        title: 'Le Mie Prenotazioni - Desk Booking System',
        canActivate: [AuthGuard]
    },

    // Redirect 404
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    }
];
