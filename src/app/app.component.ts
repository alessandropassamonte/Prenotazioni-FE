import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { AuthService, User } from './services/auth.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterModule],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    title = 'Desk Booking System';
    currentYear = new Date().getFullYear();
    currentUser: User | null = null;
    private userSubscription?: Subscription;

    constructor(public authService: AuthService) {}

    ngOnInit(): void {
        // Sottoscrizione all'utente corrente
        this.userSubscription = this.authService.currentUser.subscribe(
            user => {
                this.currentUser = user;
            }
        );
    }

    ngOnDestroy(): void {
        this.userSubscription?.unsubscribe();
    }

    logout(): void {
        if (confirm('Sei sicuro di voler effettuare il logout?')) {
            this.authService.logout();
        }
    }

    getUserDisplayName(): string {
        if (!this.currentUser) return '';
        return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }
}
