import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Angular 18: standalone bootstrap — no NgModule required.
bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
