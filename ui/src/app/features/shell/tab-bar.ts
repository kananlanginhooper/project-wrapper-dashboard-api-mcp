import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { BottomNav, NavLink } from '../../../for-apps/tab-nav';
import { FrameRoute } from '../../core/frame-route';
import { Tab } from '../../core/models';

/** Phones: the shared bottom bar with one link per dashboard. "Open this tab on its own", any status note and the
 *  credit go at the bottom of its More sheet. */
@Component({
  selector: 'app-tab-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BottomNav],
  templateUrl: './tab-bar.html',
  styleUrl: './tab-bar.scss',
})
export class TabBar {
  readonly tabs = input.required<Tab[]>();
  readonly activeId = input<string>('');
  readonly note = input<string>('');

  protected readonly route = inject(FrameRoute); // "Open … on its own" opens the app at its current page
  protected readonly active = computed(() => this.tabs().find((t) => t.id === this.activeId()));
  protected readonly links = computed<NavLink[]>(() =>
    this.tabs().map((t) => ({ link: ['/', t.id], label: t.title, icon: t.icon || 'tab' })),
  );
}
