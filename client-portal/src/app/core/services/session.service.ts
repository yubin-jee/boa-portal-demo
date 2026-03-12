import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Session {
  userId: string;
  accessToken: string;
  expiresAt: number;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private session: Session | null = null;

  readonly isAuthenticated$ = new BehaviorSubject<boolean>(false);

  setSession(session: Session): void {
    this.session = session;
    this.isAuthenticated$.next(true);
  }

  getAccessToken(): string | null {
    if (!this.session) return null;
    if (Date.now() > this.session.expiresAt) {
      this.clearSession();
      return null;
    }
    return this.session.accessToken;
  }

  clearSession(): void {
    this.session = null;
    this.isAuthenticated$.next(false);
  }

  hasRole(role: string): boolean {
    return this.session?.roles.includes(role) ?? false;
  }
}
