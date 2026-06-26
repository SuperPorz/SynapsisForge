import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/components/navbar/navbar';
import { Footer } from './shared/components/footer/footer';
import { Toast } from './shared/components/toast/toast';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, Toast],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  theme = inject(ThemeService);
}
