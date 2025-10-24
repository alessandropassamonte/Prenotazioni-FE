import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const currentUser = this.authService.currentUserValue;
    
    if (currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER')) {
      return true;
    }

    // Non autorizzato - redirect alla home
    alert('Accesso negato: questa sezione è riservata agli amministratori');
    this.router.navigate(['/']);
    return false;
  }
}
