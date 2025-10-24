import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Desk } from '../models/floor.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DeskService {
  private apiUrl = `${environment.apiUrl}/desks`;

  constructor(private http: HttpClient) {}

  getAllDesks(): Observable<Desk[]> {
    return this.http.get<Desk[]>(this.apiUrl);
  }

  getAllActiveDesks(): Observable<Desk[]> {
    return this.http.get<Desk[]>(`${this.apiUrl}/active`);
  }

  getDeskById(id: number): Observable<Desk> {
    return this.http.get<Desk>(`${this.apiUrl}/${id}`);
  }

  getDesksByFloor(floorId: number): Observable<Desk[]> {
    return this.http.get<Desk[]>(`${this.apiUrl}/floor/${floorId}`);
  }

  getDesksByDepartment(departmentId: number): Observable<Desk[]> {
    return this.http.get<Desk[]>(`${this.apiUrl}/department/${departmentId}`);
  }

  getAvailableDesks(date: string, floorId?: number, departmentId?: number): Observable<Desk[]> {
    let params = new HttpParams().set('date', date);
    
    if (floorId) {
      params = params.set('floorId', floorId.toString());
    }
    
    if (departmentId) {
      params = params.set('departmentId', departmentId.toString());
    }
    
    return this.http.get<Desk[]>(`${this.apiUrl}/available`, { params });
  }
}
