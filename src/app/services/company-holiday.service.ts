import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompanyHoliday, CreateCompanyHolidayRequest, UpdateCompanyHolidayRequest } from '../models/company-holiday.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CompanyHolidayService {
    private apiUrl = `${environment.apiUrl}/holidays`;

    constructor(private http: HttpClient) {}

    /**
     * Ottiene tutte le festività attive
     */
    getAllHolidays(): Observable<CompanyHoliday[]> {
        return this.http.get<CompanyHoliday[]>(this.apiUrl);
    }

    /**
     * Ottiene festività in un range di date
     */
    getHolidaysBetween(startDate: string, endDate: string): Observable<CompanyHoliday[]> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);
        return this.http.get<CompanyHoliday[]>(`${this.apiUrl}/range`, { params });
    }

    /**
     * Ottiene festività per ID
     */
    getHolidayById(id: number): Observable<CompanyHoliday> {
        return this.http.get<CompanyHoliday>(`${this.apiUrl}/${id}`);
    }

    /**
     * Verifica se una data è festiva
     */
    isHoliday(date: string): Observable<boolean> {
        return this.http.get<boolean>(`${this.apiUrl}/check/${date}`);
    }

    /**
     * Crea una nuova festività
     */
    createHoliday(request: CreateCompanyHolidayRequest): Observable<CompanyHoliday> {
        return this.http.post<CompanyHoliday>(this.apiUrl, request);
    }

    /**
     * Aggiorna una festività
     */
    updateHoliday(id: number, request: UpdateCompanyHolidayRequest): Observable<CompanyHoliday> {
        return this.http.put<CompanyHoliday>(`${this.apiUrl}/${id}`, request);
    }

    /**
     * Elimina (disattiva) una festività
     */
    deleteHoliday(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
