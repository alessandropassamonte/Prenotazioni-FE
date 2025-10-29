import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface AdminCard {
    title: string;
    description: string;
    icon: string;
    route: string;
    color: string;
    bgClass: string;
}

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {

    currentUser: any;

    adminCards: AdminCard[] = [
        {
            title: 'Report Occupazione',
            description: 'Visualizza statistiche e report sull\'occupazione delle postazioni per periodi personalizzati',
            icon: 'bi-graph-up',
            route: '/admin/occupancy-report',
            color: 'primary',
            bgClass: 'bg-primary-subtle'
        },
        {
            title: 'Giorni di Chiusura',
            description: 'Gestisci festività, chiusure aziendali e giorni non lavorativi',
            icon: 'bi-calendar-x',
            route: '/admin/holidays',
            color: 'danger',
            bgClass: 'bg-danger-subtle'
        }
    ];

    constructor(
        private router: Router,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        this.currentUser = this.authService.currentUserValue;
    }

    navigateTo(route: string): void {
        this.router.navigate([route]);
    }
}
