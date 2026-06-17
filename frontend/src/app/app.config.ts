import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { transformInterceptor } from './core/interceptors/transform.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(                    // senza questo HttpClient non è disponibile nell'injector
      withFetch(),
      withInterceptorsFromDi(),
      withInterceptors([transformInterceptor])
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true // "aggiungi alla lista" invece di sostituire tutti gli interceptor
    }
  ]
};
