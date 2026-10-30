import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { RouterLink } from '@angular/router';
import { FrameRoute } from '../../core/frame-route';
import { Tab } from '../../core/models';

/** Tabs that fit the bar before the rest move under "More" (the More slot makes five). */
const IN_BAR = 4;

/** Phones: a bottom tab bar (icon + short label, one tap to switch). The tabs past the fourth, "open this tab on
 *  its own" and any status note are in the More sheet. */
@Component({
  selector: 'app-tab-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatBottomSheetModule, RouterLink],
  templateUrl: './tab-bar.html',
  styleUrl: './tab-bar.scss',
})
export class TabBar {
  readonly tabs = input.required<Tab[]>();
  readonly activeId = input<string>('');
  readonly note = input<string>('');

  private readonly sheet = inject(MatBottomSheet);
  protected readonly route = inject(FrameRoute); // "Open … on its own" opens the app at its current page
  private readonly moreSheet = viewChild.required<TemplateRef<unknown>>('moreSheet');

  protected readonly inBar = computed(() => this.tabs().slice(0, IN_BAR));
  protected readonly inMore = computed(() => this.tabs().slice(IN_BAR));
  protected readonly active = computed(() => this.tabs().find((t) => t.id === this.activeId()));
  // when the open tab lives under More, the More slot shows it, so the current tab is always marked in the bar
  protected readonly activeInMore = computed(() =>
    this.inMore().find((t) => t.id === this.activeId()),
  );

  protected icon(t: Tab): string {
    return t.icon || 'tab';
  }

  /** A label that fits a fifth of a phone: the title, or its first word when the title is long. */
  protected short(t: Tab): string {
    return t.title.length <= 10 ? t.title : t.title.split(/\s+/)[0];
  }

  protected openMore(): void {
    this.sheet.open(this.moreSheet(), { ariaLabel: 'More dashboards' });
  }

  protected closeMore(): void {
    this.sheet.dismiss();
  }
}
