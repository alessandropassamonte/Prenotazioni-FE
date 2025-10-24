import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    employeeId?: string;
    departmentId?: number;
    role?: string;
    workType?: string;
    phoneNumber?: string;
}

export interface LoginResponse {
    token: string;
    type: string;
    userId: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:8080/api/auth';
    private currentUserSubject: BehaviorSubject<User | null>;
    public currentUser: Observable<User | null>;

    constructor(
        private http: HttpClient,
        private router: Router
    ) {
        const storedUser = localStorage.getItem('currentUser');
        this.currentUserSubject = new BehaviorSubject<User | null>(
            storedUser ? JSON.parse(storedUser) : null
        );
        this.currentUser = this.currentUserSubject.asObservable();
    }

    public get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    public get isAuthenticated(): boolean {
        return !!this.getToken();
    }

    public get isAdmin(): boolean {
        return this.currentUserValue?.role === 'ADMIN';
    }

    public get isManager(): boolean {
        return this.currentUserValue?.role === 'MANAGER';
    }

    /**
     * Login
     */
    login(email: string, password: string): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
            .pipe(
                tap(response => {
                    // Salva token
                    localStorage.setItem('token', response.token);

                    // Salva user
                    const user: User = {
                        id: response.userId,
                        email: response.email,
                        firstName: response.firstName,
                        lastName: response.lastName,
                        role: response.role
                    };
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    this.currentUserSubject.next(user);

                    console.log('Login effettuato:', user);
                })
            );
    }

    /**
     * Registrazione
     */
    register(request: RegisterRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/register`, request)
            .pipe(
                tap(response => {
                    // Salva token
                    localStorage.setItem('token', response.token);

                    // Salva user
                    const user: User = {
                        id: response.userId,
                        email: response.email,
                        firstName: response.firstName,
                        lastName: response.lastName,
                        role: response.role
                    };
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    this.currentUserSubject.next(user);

                    console.log('Registrazione effettuata:', user);
                })
            );
    }

    /**
     * Logout
     */
    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
    }

    /**
     * Ottiene il token JWT
     */
    getToken(): string | null {
        return localStorage.getItem('token');
    }

    /**
     * Verifica se il token è valido
     */
    verifyToken(): Observable<any> {
        return this.http.get(`${this.apiUrl}/verify`);
    }
}
