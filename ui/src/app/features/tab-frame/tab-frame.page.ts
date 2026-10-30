import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { FrameRoute, appUrl, restOf } from '../../core/frame-route';
import { TabsService } from '../../core/tabs.service';
import { EmptyState } from '../../shared/empty-state/empty-state';

/** One dashboard, full-size under the nav (route /:id, or /:id/<page> for a shared link): an iframe on the app's own
 *  URL. The app's route reports (src/for-apps) keep the address bar on its current page. */
@Component({
  selector: 'app-tab-frame-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState],
  host: { '(window:message)': 'onMessage($event)' },
  template: `
    @if (tab(); as t) {
      <iframe
        #frame
        [src]="src()"
        [title]="t.title"
        allow="clipboard-read; clipboard-write; fullscreen"
      ></iframe>
    } @else if (tabs.loaded()) {
      <app-empty-state [message]="'There is no dashboard called “' + id() + '”. Pick one above.'" />
    }
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    iframe {
      display: block;
      width: 100%;
      height: 100%;
      border: 0;
      background: var(--app-bg);
    }
  `,
})
export class TabFramePage {
  readonly id = input.required<string>(); // the :id route parameter
  protected readonly tabs = inject(TabsService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);
  private readonly route = inject(FrameRoute);
  private readonly frame = viewChild<ElementRef<HTMLIFrameElement>>('frame');

  protected readonly tab = computed(() => this.tabs.byId(this.id()));
  // the page a link opened in this tab (/<id>/<page>), read when the tab opens (a load, a Back): the app's later
  // reports only rewrite the address bar and never move the iframe; a nav click goes to the bare /<id>
  private readonly start = computed(() => restOf(this.router.url, this.id()));
  // only the URL and that page are dependencies, so a changed title or order (or a tab poll) doesn't reload the app
  private readonly url = computed(() => {
    const t = this.tab();
    return t ? appUrl(t.url, this.start()) : 'about:blank';
  });
  protected readonly src = computed(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(this.url()),
  );

  constructor() {
    effect(() => {
      const t = this.tab();
      document.title = t ? `${t.title} · Home dashboards` : 'Home dashboards';
    });
    effect(() => {
      const id = this.id();
      const path = this.start();
      untracked(() => this.route.current.set(path ? { id, path } : null));
    });
  }

  /** A route report counts only from this tab's app: its iframe's window, at the tab URL's origin. */
  protected onMessage(e: MessageEvent): void {
    const t = this.tab();
    const w = this.frame()?.nativeElement.contentWindow;
    if (!t || !w || e.source !== w || e.origin !== new URL(t.url, document.baseURI).origin) return;
    if (e.data?.type === 'route') this.route.report(t.id, e.data.path);
  }
}
