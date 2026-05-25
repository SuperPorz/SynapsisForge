import { HttpClient } from '@angular/common/http';
import { Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

interface Post {
  id: number;
  title: string;
  body: string;
}

@Component({
  selector: 'app-observable-http',
  imports: [],
  templateUrl: './observable-http.html',
  styles: ``,
})
export class ObservableHttp {
  private http = inject(HttpClient);

  posts = toSignal(
    this.http.get<Post[]>('https://jsonplaceholder.typicode.com/posts?_limit=4'),
    { initialValue: [] }
  );

  constructor() {
    effect(() => {
      console.log('posts:', this.posts());
    });
  }
}
