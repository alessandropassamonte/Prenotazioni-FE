import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
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
    isDropdownOpen = false;
    private userSubscription?: Subscription;

    constructor(public authService: AuthService) {}

    // Chiude il dropdown quando si clicca fuori
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        const clickedInside = target.closest('.dropdown');

        if (!clickedInside && this.isDropdownOpen) {
            this.isDropdownOpen = false;
        }
    }

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

    toggleDropdown(): void {
        this.isDropdownOpen = !this.isDropdownOpen;
    }

    closeDropdown(): void {
        this.isDropdownOpen = false;
    }

    logout(): void {
        if (confirm('Sei sicuro di voler effettuare il logout?')) {
            this.authService.logout();
            this.closeDropdown();
        }
    }

    getUserDisplayName(): string {
        if (!this.currentUser) return '';
        return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }
}
