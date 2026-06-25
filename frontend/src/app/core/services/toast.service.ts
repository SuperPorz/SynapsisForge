import { Injectable, signal } from '@angular/core';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toast = signal<Toast | null>(null);
  private timeout: ReturnType<typeof setTimeout> | null = null;

  show(message: string, type: Toast['type'] = 'success', duration = 4000) {
    if (this.timeout) clearTimeout(this.timeout);
    this.toast.set({ message, type });
    this.timeout = setTimeout(() => this.toast.set(null), duration);
  }
}
