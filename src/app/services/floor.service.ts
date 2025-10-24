import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Floor, FloorDetail, FloorStatistics } from '../models/floor.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FloorService {
  private apiUrl = `${environment.apiUrl}/floors`;

  constructor(private http: HttpClient) {}

  getAllFloors(): Observable<Floor[]> {
    return this.http.get<Floor[]>(this.apiUrl);
  }

  getAllActiveFloors(): Observable<Floor[]> {
    return this.http.get<Floor[]>(`${this.apiUrl}/active`);
  }

  getFloorById(id: number): Observable<FloorDetail> {
    return this.http.get<FloorDetail>(`${this.apiUrl}/${id}`);
  }

  getFloorByNumber(floorNumber: number): Observable<FloorDetail> {
    return this.http.get<FloorDetail>(`${this.apiUrl}/number/${floorNumber}`);
  }

  getFloorStatistics(floorId: number, date?: string): Observable<FloorStatistics> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date);
    }
    return this.http.get<FloorStatistics>(`${this.apiUrl}/${floorId}/statistics`, { params });
  }
}
