import { ErrorHandler, inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from './toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private toast = inject(ToastService);

  handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        this.toast.show('Network error. Check your connection.', 'error');
      }
      console.error('[HTTP Error]', error.status, error.message);
      return;
    }

    if (error instanceof Error) {
      console.error('[Uncaught Error]', error.message, error.stack);
      this.toast.show('Something went wrong. Please try again.', 'error');
      return;
    }

    console.error('[Unknown Error]', error);
  }
}
