import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(false);

  constructor() {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      this.isDark.set(stored === 'dark');
    } else {
      const hour = new Date().getHours();
      this.isDark.set(hour < 6 || hour >= 20);
    }

    effect(() => {
      const dark = this.isDark();
      document.documentElement.classList.toggle('dark', dark);
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.isDark.update((v) => !v);
  }
}
