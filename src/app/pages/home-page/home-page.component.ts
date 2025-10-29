import {Component, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {AuthService, User} from "../../services/auth.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit, OnDestroy{

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

  features = [
    {
      icon: 'bi-map',
      title: 'Mappa Interattiva',
      description: 'Visualizza in tempo reale le postazioni disponibili sulla mappa del piano'
    },
    {
      icon: 'bi-calendar-check',
      title: 'Prenotazione Facile',
      description: 'Prenota la tua postazione con un semplice click sulla mappa'
    },
    {
      icon: 'bi-clock-history',
      title: 'Gestione Prenotazioni',
      description: 'Gestisci le tue prenotazioni, effettua check-in e check-out'
    }
  ];
}
