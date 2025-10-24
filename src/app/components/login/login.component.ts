import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    loading = false;
    error = '';
    returnUrl: string = '/';

    constructor(
        private formBuilder: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        // Redirect alla home se già autenticato
        if (this.authService.isAuthenticated) {
            this.router.navigate(['/']);
        }

        this.loginForm = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    ngOnInit(): void {
        // Ottieni l'URL di ritorno dai parametri di query
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    }

    get f() {
        return this.loginForm.controls;
    }

    onSubmit(): void {
        // Reset errore
        this.error = '';

        // Verifica validità form
        if (this.loginForm.invalid) {
            Object.keys(this.loginForm.controls).forEach(key => {
                this.loginForm.get(key)?.markAsTouched();
            });
            return;
        }

        this.loading = true;

        const { email, password } = this.loginForm.value;

        this.authService.login(email, password).subscribe({
            next: () => {
                // Login effettuato con successo
                this.router.navigate([this.returnUrl]);
            },
            error: (err) => {
                // Gestisci errore
                console.error('Errore login:', err);

                if (err.status === 401) {
                    this.error = 'Email o password non corretti';
                } else if (err.status === 0) {
                    this.error = 'Impossibile connettersi al server. Verifica che il backend sia attivo.';
                } else {
                    this.error = err.error?.message || 'Si è verificato un errore. Riprova più tardi.';
                }

                this.loading = false;
            }
        });
    }
}
