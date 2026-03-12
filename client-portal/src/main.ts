import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// Angular 14 bootstrap pattern.
// Migration target → bootstrapApplication(AppComponent, appConfig) in Angular 18
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
