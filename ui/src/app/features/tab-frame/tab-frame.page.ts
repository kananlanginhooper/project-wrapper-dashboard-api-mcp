import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TabsService } from '../../core/tabs.service';
import { EmptyState } from '../../shared/empty-state/empty-state';

/** One dashboard, full-size under the nav (route /:id): an iframe on the app's own URL. */
@Component({
  selector: 'app-tab-frame-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState],
  template: `
    @if (tab(); as t) {
      <iframe
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

  protected readonly tab = computed(() => this.tabs.byId(this.id()));
  // only the URL is a dependency, so a changed title or order doesn't reload the app inside
  private readonly url = computed(() => this.tab()?.url || 'about:blank');
  protected readonly src = computed(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(this.url()),
  );

  constructor() {
    effect(() => {
      const t = this.tab();
      document.title = t ? `${t.title} · Home dashboards` : 'Home dashboards';
    });
  }
}
