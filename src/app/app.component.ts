import {Component, OnInit, OnDestroy, HostListener, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { AuthService, User } from './services/auth.service';
import { Subscription } from 'rxjs';
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {ModalService} from "./services/modal.service";

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
    modalRef?: NgbModalRef;

    @ViewChild('confirmLogoutModal') confirmLogoutModal: any;

    constructor(public authService: AuthService,  private modalServiceNgb: NgbModal) {}

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
        this.closeDropdown();
        // Chiudi il modale delle informazioni
        this.modalRef?.close();

        // Apri il modale di conferma
        setTimeout(() => {
            this.modalRef = this.modalServiceNgb.open(this.confirmLogoutModal, {
                centered: true
            });
        }, 300);


        // if (confirm('Sei sicuro di voler effettuare il logout?')) {
        //     this.authService.logout();
        //     this.closeDropdown();
        // }
    }

    confirmLogout() : void {
        this.modalRef?.close();
        this.authService.logout();
    }

    getUserDisplayName(): string {
        if (!this.currentUser) return '';
        return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }
}
