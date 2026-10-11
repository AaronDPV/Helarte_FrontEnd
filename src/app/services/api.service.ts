import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario, Servicio, Mesa, ReservaRequest, ReservaResponse, AuthResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8080';

  private currentAuth: string | null = null;
  public currentUser: AuthResponse | null = null;

  constructor(private http: HttpClient) {
    // Restaurar sesión si existe en localStorage
    const saved = localStorage.getItem('helarte_user');
    const auth = localStorage.getItem('helarte_auth');
    if (saved && auth) {
      this.currentUser = JSON.parse(saved);
      this.currentAuth = auth;
    }
  }

  setCredentials(email: string, pass: string): void {
    this.currentAuth = btoa(`${email}:${pass}`);
    localStorage.setItem('helarte_auth', this.currentAuth);
  }

  clearCredentials(): void {
    this.currentAuth = null;
    this.currentUser = null;
    localStorage.removeItem('helarte_auth');
    localStorage.removeItem('helarte_user');
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (this.currentAuth) {
      headers = headers.set('Authorization', `Basic ${this.currentAuth}`);
    }
    return headers;
  }

  // --- 1. Autenticación ---
  login(email: string, pass: string): Observable<AuthResponse> {
    this.setCredentials(email, pass);
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {}, {
      headers: this.getHeaders()
    });
  }

  registro(usuario: Usuario): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/registro`, usuario);
  }

  saveLoggedUser(user: AuthResponse): void {
    this.currentUser = user;
    localStorage.setItem('helarte_user', JSON.stringify(user));
  }

  // --- 2. Servicios de Heladería ---
  getServicios(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(`${this.apiUrl}/servicios`);
  }

  getTodosServicios(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(`${this.apiUrl}/servicios/todos`, {
      headers: this.getHeaders()
    });
  }

  crearServicio(servicio: Servicio): Observable<Servicio> {
    return this.http.post<Servicio>(`${this.apiUrl}/servicios`, servicio, {
      headers: this.getHeaders()
    });
  }

  eliminarServicio(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/servicios/${id}`, {
      headers: this.getHeaders()
    });
  }

  // --- 3. Mesas ---
  getMesas(): Observable<Mesa[]> {
    return this.http.get<Mesa[]>(`${this.apiUrl}/mesas`, {
      headers: this.getHeaders()
    });
  }

  getMesasDisponibles(): Observable<Mesa[]> {
    return this.http.get<Mesa[]>(`${this.apiUrl}/mesas/disponibles`, {
      headers: this.getHeaders()
    });
  }

  crearMesa(mesa: Mesa): Observable<Mesa> {
    return this.http.post<Mesa>(`${this.apiUrl}/mesas`, mesa, {
      headers: this.getHeaders()
    });
  }

  eliminarMesa(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/mesas/${id}`, {
      headers: this.getHeaders()
    });
  }

  // --- 4. Reservas ---
  getReservas(): Observable<ReservaResponse[]> {
    return this.http.get<ReservaResponse[]>(`${this.apiUrl}/reservas`, {
      headers: this.getHeaders()
    });
  }

  getMisReservas(): Observable<ReservaResponse[]> {
    return this.http.get<ReservaResponse[]>(`${this.apiUrl}/reservas/mis-reservas`, {
      headers: this.getHeaders()
    });
  }

  crearReserva(reserva: ReservaRequest): Observable<ReservaResponse> {
    return this.http.post<ReservaResponse>(`${this.apiUrl}/reservas`, reserva, {
      headers: this.getHeaders()
    });
  }

  cambiarEstadoReserva(id: number, estado: string): Observable<ReservaResponse> {
    return this.http.put<ReservaResponse>(`${this.apiUrl}/reservas/${id}/estado`, { estado }, {
      headers: this.getHeaders()
    });
  }

  cancelarReserva(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reservas/${id}`, {
      headers: this.getHeaders()
    });
  }

  // --- 5. Usuarios (Admin) ---
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`, {
      headers: this.getHeaders()
    });
  }

  crearUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/usuarios`, usuario, {
      headers: this.getHeaders()
    });
  }

  actualizarUsuario(id: number, usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/usuarios/${id}`, usuario, {
      headers: this.getHeaders()
    });
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`, {
      headers: this.getHeaders()
    });
  }
}
