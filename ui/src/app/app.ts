import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { TabsService } from './core/tabs.service';
import { NavBar } from './features/shell/nav-bar';

/** Home dashboards: one top nav; each tab is a standalone app in an iframe. */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavBar],
  template: `
    <app-nav-bar [tabs]="tabs.tabs()" [activeId]="activeId()" [note]="note()" />
    <main><router-outlet /></main>
  `,
  styles: `
    app-nav-bar {
      position: fixed;
      inset: 0 0 auto 0;
      z-index: 100;
    }
    /* the frame fills the rest of the dynamic viewport and does its own scrolling (no second scrollbar here);
       the side and bottom safe areas stay clear because env() reads 0 inside the app's iframe */
    main {
      position: fixed;
      top: var(--nav-top);
      left: env(safe-area-inset-left);
      right: env(safe-area-inset-right);
      height: calc(100dvh - var(--nav-top) - env(safe-area-inset-bottom));
      overflow: hidden;
    }
  `,
})
export class App {
  protected readonly tabs = inject(TabsService);
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: '' },
  );

  protected readonly activeId = computed(() => this.url().split(/[/?#]/)[1] ?? '');
  protected readonly note = computed(
    () =>
      this.tabs.error() ||
      (this.tabs.loaded() && !this.tabs.tabs().length ? 'no dashboards registered yet' : ''),
  );

  constructor() {
    // "/" opens the first tab once the list is in
    effect(() => {
      const first = this.tabs.tabs()[0];
      if (first && (this.url() === '/' || this.url() === ''))
        this.router.navigate(['/', first.id], { replaceUrl: true });
    });
  }
}
