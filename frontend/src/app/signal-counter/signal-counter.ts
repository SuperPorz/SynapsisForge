import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-signal-counter',
  imports: [],
  templateUrl: './signal-counter.html',
  styles: ``,
})
export class SignalCounter {
  counter = signal(0);

  increment() {
    this.counter.update((value) => value + 1);
  }

  decrement() {
    this.counter.update((value) => value - 1);
  }
}
