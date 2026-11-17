import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { TabsService } from './core/tabs.service';
import { NavBar } from './features/shell/nav-bar';
import { TabBar } from './features/shell/tab-bar';

/** Home dashboards: a top nav (a bottom tab bar on phones); each tab is a standalone app in an iframe. */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavBar, TabBar],
  template: `
    <app-nav-bar [tabs]="tabs.tabs()" [activeId]="activeId()" [note]="note()" />
    <main><router-outlet /></main>
    <app-tab-bar [tabs]="tabs.tabs()" [activeId]="activeId()" [note]="note()" />
  `,
  styles: `
    app-nav-bar {
      position: fixed;
      inset: 0 0 auto 0;
      z-index: 100;
    }
    /* the bottom bar shows itself at ≤600px (src/for-apps/tab-nav.ts) */
    @media (max-width: 600px) {
      app-nav-bar {
        display: none;
      }
    }
    /* the frame fills the dynamic viewport between the nav and the bottom bar (styles.scss sets both per screen
       size) and does its own scrolling; the safe areas stay clear because env() reads 0 inside the app's iframe */
    main {
      position: fixed;
      top: var(--nav-top);
      left: env(safe-area-inset-left);
      right: env(safe-area-inset-right);
      height: calc(100dvh - var(--nav-top) - var(--bar-h));
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
    // "/" opens the first tab once the list is in (also "/?x=1" or "/#y", e.g. a cache-busting link)
    effect(() => {
      const first = this.tabs.tabs()[0];
      // only after the first navigation ends (url() is '' until then): a lazy page such as /_kit ends after the tabs
      // arrive, and its id would read as '' meanwhile
      if (first && this.url() && !this.activeId())
        this.router.navigate(['/', first.id], { replaceUrl: true });
    });
  }
}
