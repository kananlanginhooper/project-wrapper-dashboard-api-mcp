import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavLink, TabStrip } from '../../../for-apps/tab-nav';
import { FrameRoute } from '../../core/frame-route';
import { Tab } from '../../core/models';

/** The top bar (wider than a phone): brand, the shared tab strip with one link per dashboard, a status note, and
 *  "open this tab on its own". Phones get the bottom TabBar instead. */
@Component({
  selector: 'app-nav-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TabStrip, MatButtonModule, MatTooltipModule],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar {
  readonly tabs = input.required<Tab[]>();
  readonly activeId = input<string>('');
  readonly note = input<string>('');

  protected readonly route = inject(FrameRoute); // ↗ opens the app at its current page
  protected readonly active = computed(() => this.tabs().find((t) => t.id === this.activeId()));
  protected readonly links = computed<NavLink[]>(() =>
    this.tabs().map((t) => ({
      link: ['/', t.id],
      label: t.title,
      tooltip: t.description || t.title,
    })),
  );
}
