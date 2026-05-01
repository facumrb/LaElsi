import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { AppRoutes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';

registerLocaleData(localeEsAr);

export const AppConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(AppRoutes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-AR' },
  ],
};
