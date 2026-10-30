import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Tab } from '../../core/models';

/** The top bar (wider than a phone): brand, one Material tab link per dashboard, a status note, and
 *  "open this tab on its own". The strip scrolls by drag or wheel, not arrow buttons (theme.scss).
 *  Phones get the bottom TabBar instead. */
@Component({
  selector: 'app-nav-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTabsModule, MatButtonModule, MatTooltipModule, RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
  host: { '(window:resize)': 'showActiveTab()' },
})
export class NavBar {
  readonly tabs = input.required<Tab[]>();
  readonly activeId = input<string>('');
  readonly note = input<string>('');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly active = computed(() => this.tabs().find((t) => t.id === this.activeId()));

  constructor() {
    // after the tab list arrives or the route changes; one frame later the links are rendered (the router marks
    // the active one later still, so find it by position rather than by its active class)
    afterRenderEffect(() => {
      this.active();
      requestAnimationFrame(() => this.showActiveTab());
    });
  }

  /** Scroll the strip so the active tab is in view (also after a resize, e.g. a phone turning to landscape). */
  protected showActiveTab(): void {
    const i = this.tabs().findIndex((t) => t.id === this.activeId());
    const links = this.host.nativeElement.querySelectorAll('a.mat-mdc-tab-link');
    links[i]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
