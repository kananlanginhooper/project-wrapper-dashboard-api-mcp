import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { Tabs } from './tabs';

/** Home dashboards: one top nav; each tab is a standalone app in an iframe. */
@Component({
  selector: 'shell-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav>
      <span class="brand">Home dashboards</span>
      @for (t of reg.tabs(); track t.id) {
        <a [routerLink]="['/', t.id]" routerLinkActive="on" [title]="t.description || t.title">{{ t.title }}</a>
        <a class="out" [href]="t.url" target="_blank" rel="noopener" [title]="'Open ' + t.title + ' on its own'">↗</a>
      }
      @if (reg.error()) { <span class="warn">{{ reg.error() }}</span> }
      @else if (reg.loaded() && !reg.tabs().length) { <span class="warn">no dashboards registered yet</span> }
    </nav>
    <main><router-outlet /></main>`,
})
export class App {
  protected readonly reg = inject(Tabs);
  private readonly router = inject(Router);
  private readonly url = toSignal(this.router.events.pipe(filter(e => e instanceof NavigationEnd), map(() => this.router.url)), { initialValue: '' });

  constructor() {
    // "/" opens the first tab once the list is in
    effect(() => {
      const first = this.reg.tabs()[0];
      if (first && (this.url() === '/' || this.url() === '')) this.router.navigate(['/', first.id], { replaceUrl: true });
    });
  }
}
