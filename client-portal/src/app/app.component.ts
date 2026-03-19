import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'gb-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="gb-nav">
      <span class="gb-logo">GlobalBank</span>
      <a routerLink="/payments" routerLinkActive="active">Payments</a>
      <a routerLink="/transfers" routerLinkActive="active">Transfers</a>
      <a routerLink="/profile" routerLinkActive="active">Profile</a>
    </nav>
    <main><router-outlet></router-outlet></main>
  `,
})
export class AppComponent {}
