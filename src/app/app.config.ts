import { ApplicationConfig, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NgbModule, NgbDatepickerI18n } from '@ng-bootstrap/ng-bootstrap';
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';

import { routes } from './app.routes';
import { jwtInterceptor } from "./interceptors/jwt.interceptor";
import { CustomDatepickerI18n } from './services/custom-datepicker-i18n.service';

// Registra il locale italiano
registerLocaleData(localeIt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideAnimations(),
    importProvidersFrom(NgbModule),
    { provide: LOCALE_ID, useValue: 'it-IT' },
    { provide: NgbDatepickerI18n, useClass: CustomDatepickerI18n }
  ]
};
