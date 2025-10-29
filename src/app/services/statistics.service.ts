import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OccupancyStatistics {
  startDate: string;
  endDate: string;
  totalWorkingDays: number;
  totalDesks: number;
  averageOccupancyRate: number;
  averageOccupiedDesks: number;
  averageFreeDesks: number;
  mostOccupiedDay: DayOccupancy | null;
  leastOccupiedDay: DayOccupancy | null;
  dailyOccupancy: DayOccupancy[];
  floorStatistics: FloorOccupancyStats[];
}

export interface DayOccupancy {
  date: string;
  dayOfWeek: string;
  occupiedDesks: number;
  freeDesks: number;
  totalDesks: number;
  occupancyRate: number;
  isHoliday: boolean;
  holidayName: string | null;
}

export interface FloorOccupancyStats {
  floorId: number;
  floorName: string;
  floorNumber: number;
  totalDesks: number;
  averageOccupancyRate: number;
  totalBookings: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = `${environment.apiUrl}/statistics`;

  constructor(private http: HttpClient) {}

  /**
   * Ottiene statistiche per un periodo personalizzato
   */
  getOccupancyStatistics(startDate: string, endDate: string): Observable<OccupancyStatistics> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<OccupancyStatistics>(`${this.apiUrl}/occupancy`, { params });
  }

  /**
   * Ottiene statistiche per oggi
   */
  getTodayStatistics(): Observable<OccupancyStatistics> {
    return this.http.get<OccupancyStatistics>(`${this.apiUrl}/occupancy/today`);
  }

  /**
   * Ottiene statistiche per la settimana corrente
   */
  getCurrentWeekStatistics(): Observable<OccupancyStatistics> {
    return this.http.get<OccupancyStatistics>(`${this.apiUrl}/occupancy/week`);
  }

  /**
   * Ottiene statistiche per il mese corrente
   */
  getCurrentMonthStatistics(): Observable<OccupancyStatistics> {
    return this.http.get<OccupancyStatistics>(`${this.apiUrl}/occupancy/month`);
  }
}
