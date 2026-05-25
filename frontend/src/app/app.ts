import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiService } from './core/services/api.service';
import { SignalCounter } from './signal-counter/signal-counter';
import { ObservableHttp } from './observable-http/observable-http';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SignalCounter, ObservableHttp],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('frontend');

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<any[]>('/courses?page=1&limit=10').subscribe({
      next: (data) => console.log('✅ corsi:', data),
      error: (err) => console.error('❌ errore del cazzo:', err),
    });
  }
}
