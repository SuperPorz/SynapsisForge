import { Injectable, signal } from '@angular/core';
import { fromEvent, merge } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private _isOnline = signal(true);
  readonly isOnline = this._isOnline.asReadonly();

  constructor() {
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false)),
    )
      .pipe(startWith(navigator.onLine))
      .subscribe((online) => this._isOnline.set(online));
  }
}
