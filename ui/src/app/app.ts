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
    /* the stage is the scroll container, so an app's sticky header sticks under the nav */
    main {
      position: fixed;
      inset: var(--nav-h) 0 0 0;
      overflow: auto;
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
