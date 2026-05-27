import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ─────────────────────────────────────────────────────────────────────────────
// TIPI
// ─────────────────────────────────────────────────────────────────────────────

// Rispecchia esattamente il JwtPayload del backend
interface JwtPayload {
  sub: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  exp: number; // timestamp Unix — aggiunto automaticamente da jwtService.signAsync()
}

// Forma pubblica dell'utente esposta ai componenti tramite signal.
// Non esponiamo JwtPayload direttamente: è un dettaglio implementativo del token.
export interface User {
  id: string;          // = payload.sub
  email: string;
  role: 'student' | 'instructor' | 'admin';
}

interface LoginDto {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root', // singleton, disponibile in tutta l'app senza aggiungerlo ai providers
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'access_token';
  private readonly API = environment.apiUrl;

  // ─── SIGNAL ────────────────────────────────────────────────────────────────
  //
  // Sorgente di verità per l'utente corrente.
  // Privato con setter: solo AuthService può modificarlo, i consumer lo leggono
  // tramite i computed pubblici qui sotto (o currentUser() nei casi che lo richiedono).
  //
  // "private readonly" + signal writable è il pattern consigliato Angular 18:
  // evita che un componente chiami currentUser.set() dall'esterno per
  // falsificare lo stato auth.
  //
  private readonly _currentUser = signal<User | null>(null);

  // Computed pubblici: derivati dal signal, aggiornati automaticamente.
  // I template li leggono senza async pipe e senza subscribe.
  readonly currentUser     = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly role            = computed(() => this._currentUser()?.role ?? null);
  readonly userId          = computed(() => this._currentUser()?.id ?? null);

  // ─── IDRATAZIONE ALL'AVVIO ────────────────────────────────────────────────
  //
  // Se l'utente aveva già fatto login in una sessione precedente il token è
  // ancora nel localStorage. Lo decodifichiamo subito così i componenti che
  // leggono currentUser() trovano già i dati anche prima del primo login.
  //
  // Il costruttore viene chiamato una sola volta (singleton).
  //
  constructor() {
    const token = this.getToken();
    if (token) {
      const user = this.buildUserFromToken(token);
      // buildUserFromToken controlla anche la scadenza: se il token è già
      // scaduto restituisce null e il signal rimane null (utente non loggato).
      this._currentUser.set(user);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGIN — chiama POST /auth/login, salva l'access token
  // Il refresh token arriva come httpOnly cookie: il browser lo gestisce da solo,
  // Angular non lo vede e non deve toccarlo.
  // ─────────────────────────────────────────────────────────────────────────────
  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API}/auth/login`, dto, {
        withCredentials: true, // necessario per ricevere e inviare il cookie httpOnly
      })
      .pipe(
        tap((response) => {
          this.applyToken(response.accessToken);
        }),
      );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGOUT — chiama POST /auth/logout (invalida il refresh token nel DB),
  // poi pulisce lo stato locale.
  // ─────────────────────────────────────────────────────────────────────────────
  logout(): void {
    this.http
      .post(`${this.API}/auth/logout`, {}, { withCredentials: true })
      .subscribe({
        complete: () => this.clearSessionAndRedirect(),
        error: ()    => this.clearSessionAndRedirect(), // pulisce anche in caso di errore
      });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REFRESH — chiama POST /auth/refresh usando il cookie httpOnly.
  // Il browser invia automaticamente il cookie grazie a withCredentials: true.
  // Chiamato dall'interceptor quando riceve un 401.
  // ─────────────────────────────────────────────────────────────────────────────
  refresh(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((response) => {
          this.applyToken(response.accessToken);
        }),
      );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // isLoggedIn — controlla che il token esista e non sia scaduto.
  // Usato dall'authGuard per proteggere le route.
  //
  // NOTA: isAuthenticated (computed) è la versione reattiva per i template.
  //       isLoggedIn() è la versione imperativa per guard e interceptor che
  //       vivono fuori dal ciclo di change detection.
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
  // hasRole — utility usata dal roleGuard.
  // Controlla se il ruolo dell'utente è tra quelli richiesti dalla route.
  // ─────────────────────────────────────────────────────────────────────────────
  hasRole(allowedRoles: string[]): boolean {
    const r = this.role(); // legge il computed signal
    if (!r) return false;
    return allowedRoles.includes(r);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // getToken — legge il token dal localStorage.
  // Usato dall'interceptor per aggiungere l'header Authorization.
  // ─────────────────────────────────────────────────────────────────────────────
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS PRIVATI
  // ─────────────────────────────────────────────────────────────────────────────

  // applyToken: unico punto in cui token + signal vengono aggiornati insieme.
  // Chiamato da login() e refresh() per garantire consistenza tra storage e signal.
  private applyToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    const user = this.buildUserFromToken(token);
    this._currentUser.set(user);  // aggiorna il signal → tutti i computed reagiscono
  }

  private clearSessionAndRedirect(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this._currentUser.set(null);  // aggiorna il signal → navbar, guard, ecc. reagiscono
    this.router.navigate(['/login']);
  }

  // buildUserFromToken: costruisce l'oggetto User dal payload del JWT.
  // Restituisce null se il token è malformato o già scaduto.
  private buildUserFromToken(token: string): User | null {
    const payload = this.decodeToken(token);
    if (!payload) return null;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) return null; // token scaduto: non idratare lo stato

    return {
      id:    payload.sub,
      email: payload.email,
      role:  payload.role,
    };
  }

  // Decodifica il payload del JWT senza librerie esterne.
  // Il JWT è composto da tre parti separate da '.': header.payload.signature
  // Il payload è una stringa base64url — atob() la decodifica dopo aver
  // normalizzato i caratteri non-standard di base64url (+/ vs -_).
  private decodeToken(token: string | null): JwtPayload | null {
    if (!token) return null;

    try {
      // base64url → base64 standard (sostituisce - con + e _ con /)
      const base64Payload = token.split('.')[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const decoded = atob(base64Payload);
      return JSON.parse(decoded) as JwtPayload;
    } catch {
      return null; // token malformato
    }
  }

  /*
  ─── FAKE JWT PER SVILUPPO ───────────────────────────────────────────────────

  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InRlc3RAc3luYXBzaXMuY29tIiwicm9sZSI6Imluc3RydWN0b3IiLCJleHAiOjk5OTk5OTk5OTl9.LwYkVAibXIb58CEibBOVgS7sG2_OO7CGKFZhcKEy-UM

  Payload:
  {
    "sub": "123e4567-e89b-12d3-a456-426614174000",
    "email": "test@synapsis.com",
    "role": "instructor",
    "exp": 9999999999
  }

  Console per testare senza backend:
  localStorage.setItem('access_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InRlc3RAc3luYXBzaXMuY29tIiwicm9sZSI6Imluc3RydWN0b3IiLCJleHAiOjk5OTk5OTk5OTl9.LwYkVAibXIb58CEibBOVgS7sG2_OO7CGKFZhcKEy-UM')
  ─────────────────────────────────────────────────────────────────────────────
  */
}