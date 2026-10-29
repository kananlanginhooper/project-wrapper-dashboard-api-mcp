import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Tab, Tabs } from './tabs';

/** One dashboard, full-size under the nav (route /:id): an iframe on the app's own URL. */
@Component({
  selector: 'shell-tab-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (tab(); as t) {
      <iframe [src]="src()" [title]="t.title" allow="clipboard-read; clipboard-write; fullscreen"></iframe>
    } @else if (reg.loaded()) {
      <div class="msg">There is no dashboard called “{{ id() }}”. Pick one above.</div>
    }`,
  styles: `
    :host { display: block; height: 100%; }
    iframe { display: block; width: 100%; height: 100%; border: 0; background: var(--bg); }
    .msg { padding: 24px; color: var(--muted); }`,
})
export class TabFrame {
  readonly id = input.required<string>();
  protected readonly reg = inject(Tabs);
  private readonly san = inject(DomSanitizer);

  protected readonly tab = computed<Tab | undefined>(() => this.reg.tabs().find(t => t.id === this.id()));
  // only the URL is a dependency, so a changed title or order doesn't reload the app inside
  private readonly url = computed(() => this.tab()?.url || 'about:blank');
  protected readonly src = computed(() => this.san.bypassSecurityTrustResourceUrl(this.url()));

  constructor() {
    effect(() => { const t = this.tab(); document.title = t ? `${t.title} · Home dashboards` : 'Home dashboards'; });
  }
}
