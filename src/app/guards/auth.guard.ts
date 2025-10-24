import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    Router,
    CanActivate
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean {
        if (this.authService.isAuthenticated) {
            // Controlla ruoli se specificati
            const requiredRoles = route.data['roles'] as Array<string>;
            if (requiredRoles) {
                const userRole = this.authService.currentUserValue?.role;
                if (userRole && requiredRoles.includes(userRole)) {
                    return true;
                } else {
                    this.router.navigate(['/forbidden']);
                    return false;
                }
            }
            return true;
        }

        // Non autenticato - redirect al login
        this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
        });
        return false;
    }
}
