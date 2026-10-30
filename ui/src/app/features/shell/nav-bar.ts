import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  afterRenderEffect,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabNav, MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Tab } from '../../core/models';

/** The top bar: brand, one Material tab link per dashboard (a menu on phones), a status note, and
 *  "open this tab on its own". */
@Component({
  selector: 'app-nav-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTabsModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
  host: { '(window:resize)': 'showActiveTab()' },
})
export class NavBar {
  readonly tabs = input.required<Tab[]>();
  readonly activeId = input<string>('');
  readonly note = input<string>('');

  private readonly strip = viewChild(MatTabNav);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly active = computed(() => this.tabs().find((t) => t.id === this.activeId()));
  private readonly activeIndex = computed(() =>
    this.tabs().findIndex((t) => t.id === this.activeId()),
  );

  constructor() {
    // the tab list arrives after the strip first lays out, so Material never pages to the active tab on its own;
    // one frame later its links are registered
    afterRenderEffect(() => {
      this.activeIndex();
      requestAnimationFrame(() => this.showActiveTab());
    });
  }

  /** Page the tab strip so the active tab is in view (also after a resize, e.g. a phone turning to landscape). */
  protected showActiveTab(): void {
    const strip = this.strip();
    const i = this.activeIndex();
    if (!strip || i < 0) return;
    strip.updatePagination();
    strip._scrollToLabel(i);
    this.cdr.detectChanges(); // Material moves the strip in its content check, which zoneless mode won't schedule
  }
}
