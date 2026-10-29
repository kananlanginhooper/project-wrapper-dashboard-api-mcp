import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Tab } from '../../core/models';

/** The top bar: brand, one Material tab link per dashboard, a status note, and "open this tab on its own". */
@Component({
  selector: 'app-nav-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTabsModule, MatButtonModule, MatTooltipModule, RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.scss',
})
export class NavBar {
  readonly tabs = input.required<Tab[]>();
  readonly activeId = input<string>('');
  readonly note = input<string>('');

  protected readonly active = computed(() => this.tabs().find((t) => t.id === this.activeId()));
}
