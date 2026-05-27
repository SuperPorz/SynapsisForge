import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Rispecchia esattamente il JwtPayload del backend
interface JwtPayload {
  sub: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  exp: number; // timestamp Unix — aggiunto automaticamente da jwtService.signAsync()
}

interface LoginDto {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
}

@Injectable({
  providedIn: 'root', // singleton, disponibile in tutta l'app senza aggiungerlo ai providers
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'access_token';
  private readonly API = environment.apiUrl;

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGIN — chiama POST /auth/login, salva l'access token
  // Il refresh token arriva come httpOnly cookie: il browser lo gestisce da solo,
  // Angular non lo vede e non deve toccarlo
  // ─────────────────────────────────────────────────────────────────────────────
  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API}/auth/login`, dto, {
        withCredentials: true, // necessario per ricevere e inviare il cookie httpOnly
      })
      .pipe(
        tap((response) => {
          this.saveToken(response.accessToken);
        }),
      );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGOUT — chiama POST /auth/logout (invalida il refresh token nel DB),
  // poi pulisce lo stato locale
  // ─────────────────────────────────────────────────────────────────────────────
  logout(): void {
    this.http.post(`${this.API}/auth/logout`, {}, { withCredentials: true }).subscribe({
      complete: () => this.clearSessionAndRedirect(),
      error: () => this.clearSessionAndRedirect(), // pulisce anche in caso di errore
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REFRESH — chiama POST /auth/refresh usando il cookie httpOnly
  // Il browser invia automaticamente il cookie grazie a withCredentials: true
  // Usato dall'interceptor quando riceve un 401
  // ─────────────────────────────────────────────────────────────────────────────
  refresh(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((response) => {
          this.saveToken(response.accessToken);
        }),
      );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // isLoggedIn — controlla che il token esista e non sia scaduto
  // Confronta il campo exp del payload (timestamp Unix in secondi)
  // con l'ora corrente
  // ─────────────────────────────────────────────────────────────────────────────
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const payload = this.decodeToken(token);
    if (!payload) return false;

    const now = Math.floor(Date.now() / 1000); // converti ms in secondi
    return payload.exp > now;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // getRole — legge il ruolo direttamente dal payload del JWT
  // Non serve una chiamata al backend: il ruolo è già nel token
  // ─────────────────────────────────────────────────────────────────────────────
  getRole(): JwtPayload['role'] | null {
    const payload = this.decodeToken(this.getToken());
    return payload?.role ?? null;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // hasRole — utility usata dal roleGuard
  // Controlla se il ruolo dell'utente è tra quelli richiesti dalla route
  // ─────────────────────────────────────────────────────────────────────────────
  hasRole(allowedRoles: string[]): boolean {
    const role = this.getRole();
    if (!role) return false;
    return allowedRoles.includes(role);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // getCurrentUserId — restituisce il sub (UUID utente) dal payload
  // Utile per chiamate API tipo GET /users/:id
  // ─────────────────────────────────────────────────────────────────────────────
  getCurrentUserId(): string | null {
    const payload = this.decodeToken(this.getToken());
    return payload?.sub ?? null;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // getToken — legge il token dal localStorage
  // ─────────────────────────────────────────────────────────────────────────────
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS PRIVATI
  // ─────────────────────────────────────────────────────────────────────────────

  private saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private clearSessionAndRedirect(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  // Decodifica il payload del JWT senza librerie esterne.
  // Il JWT è composto da tre parti separate da '.': header.payload.signature
  // Il payload è semplicemente una stringa base64 — atob() la decodifica
  private decodeToken(token: string | null): JwtPayload | null {
    if (!token) return null;

    try {
      const base64Payload = token.split('.')[1];
      const decoded = atob(base64Payload);
      return JSON.parse(decoded) as JwtPayload;
    } catch {
      // Token malformato
      return null;
    }
  }

  /* 
  fake jwt

  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InRlc3RAc3luYXBzaXMuY29tIiwicm9sZSI6Imluc3RydWN0b3IiLCJleHAiOjk5OTk5OTk5OTl9.LwYkVAibXIb58CEibBOVgS7sG2_OO7CGKFZhcKEy-UM

  {
    "sub": "123e4567-e89b-12d3-a456-426614174000",
    "email": "test@synapsis.com",
    "role": "instructor",
    "exp": 9999999999
  }

  localStorage.setItem('access_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InRlc3RAc3luYXBzaXMuY29tIiwicm9sZSI6Imluc3RydWN0b3IiLCJleHAiOjk5OTk5OTk5OTl9.LwYkVAibXIb58CEibBOVgS7sG2_OO7CGKFZhcKEy-UM')
  */
}
