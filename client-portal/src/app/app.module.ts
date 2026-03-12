import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { AppComponent } from './app.component';

// ─────────────────────────────────────────────────────────────────────────────
// ROOT NgModule — GlobalBank Client Portal
//
// Angular 14: every feature is declared or lazy-loaded through this central
// NgModule. HttpClientModule provides HttpClient to the entire app via DI.
//
// Angular 18 migration targets:
//   • Delete this file entirely
//   • HttpClientModule      → provideHttpClient() in app.config.ts
//   • BrowserModule         → provideAnimations() / bootstrapApplication handles this
//   • Routing               → provideRouter(routes) in app.config.ts
//   • CoreModule            → provideX() functions or standalone providers
// ─────────────────────────────────────────────────────────────────────────────
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    CoreModule,
    AppRoutingModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
