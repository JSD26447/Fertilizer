import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';
  isLoggedIn$ = new BehaviorSubject<boolean>(!!localStorage.getItem('admin_token'));

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string) {
    return this.http.post<{ access_token: string; username: string }>(`${this.apiUrl}/login`, { username, password });
  }

  saveToken(token: string, username: string) {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_username', username);
    this.isLoggedIn$.next(true);
  }

  logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    this.isLoggedIn$.next(false);
    this.router.navigate(['/admin/login']);
  }

  getUsername(): string {
    return localStorage.getItem('admin_username') || 'admin';
  }
}
