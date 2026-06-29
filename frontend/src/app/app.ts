import { Component, inject } from '@angular/core';
import { ChildrenOutletContexts, RouterOutlet } from '@angular/router';
import { Navbar } from './shared/components/navbar/navbar';
import { Footer } from './shared/components/footer/footer';
import { Toast } from './shared/components/toast/toast';
import { ThemeService } from './core/services/theme.service';
import { ConnectivityService } from './core/services/connectivity.service';
import { routeAnimations } from './animations';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, Toast],
  templateUrl: './app.html',
  styleUrl: './app.css',
  animations: [routeAnimations],
})
export class App {
  theme = inject(ThemeService);
  connectivity = inject(ConnectivityService);
  private contexts = inject(ChildrenOutletContexts);

  getRouteAnimationState() {
    return this.contexts.getContext('primary')?.route?.snapshot?.url?.[0]?.path ?? '';
  }
}
