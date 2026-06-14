import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, map, of, tap } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  role: 'USER' | 'BUSINESS_OWNER' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  userLevel?: number;
  experiencePoints?: number;
  bio?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface ProfileUpdatePayload {
  fullName?: string;
  bio?: string;
  avatarFile?: File | null;
  coverFile?: File | null;
}

export interface PublicProfile {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  userLevel: number;
  experiencePoints: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBase = 'http://localhost:3000';
  private readonly authBase = `${this.apiBase}/auth`;
  private readonly profileBase = `${this.apiBase}/profile`;
  private readonly tokenKey = 'accessToken';
  private readonly refreshKey = 'refreshToken';

  private readonly userSubject = new BehaviorSubject<AuthUser | null>(null);
  private readonly tokenSubject = new BehaviorSubject<string | null>(
    this.getStoredToken(),
  );

  private readonly userSignal = signal<AuthUser | null>(null);
  private readonly tokenSignal = signal<string | null>(this.getStoredToken());

  readonly user$ = this.userSubject.asObservable();
  readonly token$ = this.tokenSubject.asObservable();
  readonly user = computed(() => this.userSignal());
  readonly accessToken = computed(() => this.tokenSignal());
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  constructor(private readonly http: HttpClient) {}

  login(payload: LoginPayload) {
    return this.http.post<AuthResponse>(`${this.authBase}/login`, payload).pipe(
      tap((response) => this.setSession(response)),
      map((response) => response.user),
    );
  }

  register(payload: RegisterPayload) {
    return this.http.post<AuthResponse>(`${this.authBase}/register`, payload).pipe(
      tap((response) => this.setSession(response)),
      map((response) => response.user),
    );
  }

  verifyEmail(token: string) {
    return this.http.get<{ message: string }>(`${this.authBase}/verify`, {
      params: { token },
    });
  }

  forgotPassword(payload: ForgotPasswordPayload) {
    return this.http.post<{ message: string }>(
      `${this.authBase}/forgot-password`,
      payload,
    );
  }

  resetPassword(payload: ResetPasswordPayload) {
    return this.http.post<{ message: string }>(
      `${this.authBase}/reset-password`,
      payload,
    );
  }

  loginWithGoogle() {
    if (typeof window !== 'undefined') {
      window.location.href = `${this.authBase}/google`;
    }
  }

  fetchProfile() {
    return this.http.get<AuthUser>(`${this.profileBase}/me`).pipe(
      tap((user) => this.setUser(user)),
      catchError(() => of(null)),
    );
  }

  updateProfile(payload: ProfileUpdatePayload) {
    const formData = new FormData();
    if (payload.fullName !== undefined) {
      formData.append('fullName', payload.fullName);
    }
    if (payload.bio !== undefined) {
      formData.append('bio', payload.bio);
    }
    if (payload.avatarFile) {
      formData.append('avatar', payload.avatarFile);
    }
    if (payload.coverFile) {
      formData.append('cover', payload.coverFile);
    }

    return this.http.patch<AuthUser>(`${this.profileBase}/me`, formData).pipe(
      tap((user) => this.setUser(user)),
    );
  }

  updateAccount(payload: { email?: string; currentPassword?: string; newPassword?: string }) {
    return this.http.patch<AuthUser>(`${this.profileBase}/account`, payload).pipe(
      tap((user) => this.setUser(user)),
    );
  }

  getPublicProfile(userId: string) {
    return this.http.get<PublicProfile>(`${this.profileBase}/public/${userId}`);
  }

  logout() {
    this.clearSession();
  }

  getAccessToken() {
    return this.tokenSignal();
  }

  updateAccessToken(token: string) {
    this.tokenSubject.next(token);
    this.tokenSignal.set(token);
  }

  private setUser(user: AuthUser | null) {
    this.userSubject.next(user);
    this.userSignal.set(user);
  }

  private setSession(response: AuthResponse) {
    this.setUser(response.user);
    this.tokenSubject.next(response.accessToken);
    this.tokenSignal.set(response.accessToken);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.tokenKey, response.accessToken);
      localStorage.setItem(this.refreshKey, response.refreshToken);
    }
  }

  private clearSession() {
    this.setUser(null);
    this.tokenSubject.next(null);
    this.tokenSignal.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.refreshKey);
    }
  }

  private getStoredToken() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }
}
