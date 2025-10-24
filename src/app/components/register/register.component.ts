import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, RegisterRequest } from '../../services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
    registerForm: FormGroup;
    loading = false;
    error = '';
    success = false;

    // Opzioni per i select
    workTypes = [
        { value: 'STANDARD', label: 'Standard' },
        { value: 'SHIFT_WORKER', label: 'Turnista' },
        { value: 'PART_TIME', label: 'Part Time' }
    ];

    roles = [
        { value: 'USER', label: 'Utente' },
        { value: 'MANAGER', label: 'Manager' }
    ];

    constructor(
        private formBuilder: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        // Redirect alla home se già autenticato
        if (this.authService.isAuthenticated) {
            this.router.navigate(['/']);
        }

        this.registerForm = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
            employeeId: [''],
            phoneNumber: ['', [Validators.pattern(/^[0-9+\-\s()]*$/)]],
            workType: ['STANDARD'],
            role: ['USER']
        }, {
            validators: this.passwordMatchValidator
        });
    }

    // Validator personalizzato per verificare che le password coincidano
    passwordMatchValidator(form: FormGroup) {
        const password = form.get('password');
        const confirmPassword = form.get('confirmPassword');

        if (password && confirmPassword && password.value !== confirmPassword.value) {
            confirmPassword.setErrors({ passwordMismatch: true });
            return { passwordMismatch: true };
        } else {
            // Rimuovi l'errore se le password coincidono
            if (confirmPassword?.hasError('passwordMismatch')) {
                confirmPassword.setErrors(null);
            }
            return null;
        }
    }

    get f() {
        return this.registerForm.controls;
    }

    onSubmit(): void {
        // Reset errore
        this.error = '';
        this.success = false;

        // Verifica validità form
        if (this.registerForm.invalid) {
            Object.keys(this.registerForm.controls).forEach(key => {
                this.registerForm.get(key)?.markAsTouched();
            });
            return;
        }

        this.loading = true;

        // Prepara i dati per la registrazione (escludendo confirmPassword)
        const { confirmPassword, ...registerData } = this.registerForm.value;

        // Rimuovi campi vuoti opzionali
        const cleanedData: RegisterRequest = {
            ...registerData,
            employeeId: registerData.employeeId || undefined,
            phoneNumber: registerData.phoneNumber || undefined
        };

        this.authService.register(cleanedData).subscribe({
            next: () => {
                // Registrazione effettuata con successo
                this.success = true;
                setTimeout(() => {
                    this.router.navigate(['/']);
                }, 1500);
            },
            error: (err) => {
                // Gestisci errore
                console.error('Errore registrazione:', err);

                if (err.status === 409) {
                    this.error = 'Email già registrata. Prova ad effettuare il login.';
                } else if (err.status === 400) {
                    this.error = err.error?.message || 'Dati non validi. Controlla i campi e riprova.';
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
