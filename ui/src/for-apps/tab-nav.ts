import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  afterRenderEffect,
  computed,
  contentChild,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';

// The app's page links, two ways (DASHBOARD-REQUIREMENTS 5a). Copy this file into an app as is.
// - <app-tab-strip>: a Material tab strip that scrolls by finger or wheel (no paging arrows) and keeps the current
//   tab in view. Use it in the app's header at every width. Needs the shared theme (the strip rule in theme.scss).
// - <app-bottom-nav>: a phone bottom bar (≤600px): icon + short label, the first four links, the rest under "More".
//   It hides itself inside the home-dashboards wrapper, whose own bottom bar is already there; opened on its own, the
//   app shows it. Icons are Material Symbols names (the material-symbols package's outlined.css in angular.json).

/** One page link. `link` is a routerLink value: '/jobs' or ['/jobs', id]. */
export interface NavLink {
  link: string | readonly unknown[];
  label: string;
  /** a Material Symbols name, for the bottom bar ('tab' if none) */
  icon?: string;
  /** the bottom bar's label when `label` is too long for a fifth of a phone (default: its first word) */
  short?: string;
  /** shown on hover in the tab strip */
  tooltip?: string;
}

/** The index of the link the current URL is under (-1 for none), recomputed after each navigation. */
function activeIndex(links: () => readonly NavLink[]) {
  const router = inject(Router);
  const url = toSignal(
    router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => router.url),
    ),
    { initialValue: router.url },
  );
  return computed(() => {
    url();
    return links().findIndex((l) =>
      router.isActive(router.createUrlTree(typeof l.link === 'string' ? [l.link] : [...l.link]), {
        paths: 'subset',
        queryParams: 'ignored',
        fragment: 'ignored',
        matrixParams: 'ignored',
      }),
    );
  });
}

@Component({
  selector: 'app-tab-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTabsModule, MatTooltipModule, RouterLink],
  host: { '(window:resize)': 'showActive()' },
  template: `
    <nav
      mat-tab-nav-bar
      [tabPanel]="panel"
      [disablePagination]="true"
      mat-stretch-tabs="false"
      mat-align-tabs="start"
    >
      @for (l of links(); track $index) {
        <a
          mat-tab-link
          [routerLink]="l.link"
          [active]="$index === active()"
          [matTooltip]="l.tooltip ?? ''"
          [matTooltipDisabled]="!l.tooltip"
          >{{ l.label }}</a
        >
      }
    </nav>
    <mat-tab-nav-panel #panel />
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    nav {
      border-bottom: 0;
      --mat-tab-header-divider-height: 0;
    }
  `,
})
export class TabStrip {
  readonly links = input.required<readonly NavLink[]>();
  protected readonly active = activeIndex(this.links);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    // after the links render or the route changes (by index: the links are in the DOM by now, which the in-app
    // browser pane and a hidden tab need, as neither runs requestAnimationFrame)
    afterRenderEffect(() => {
      this.active();
      this.showActive();
    });
  }

  /** Scroll the strip so the current tab is in view (also after a resize, e.g. a phone turning to landscape). */
  protected showActive(): void {
    const links = this.host.querySelectorAll('a.mat-mdc-tab-link');
    links[this.active()]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

/** Links past these go under "More" (the More slot makes five). */
const IN_BAR = 4;

/** The phone bottom bar. Anything extra for the More sheet goes in an <ng-template let-close> inside it (`close()`
 *  dismisses the sheet); a `dot` marks the More slot (a status note in there). Pad the page's bottom by
 *  calc(56px + env(safe-area-inset-bottom)) at ≤600px so the bar doesn't cover content. */
@Component({
  selector: 'app-bottom-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatBottomSheetModule, RouterLink, NgTemplateOutlet],
  host: { '[class.framed]': 'framed' },
  template: `
    <nav aria-label="Pages">
      @for (l of inBar(); track $index) {
        <a
          class="slot"
          [routerLink]="l.link"
          [class.current]="$index === active()"
          [attr.aria-current]="$index === active() ? 'page' : null"
        >
          <span class="icon" aria-hidden="true">{{ l.icon || 'tab' }}</span>
          <span class="label">{{ short(l) }}</span>
        </a>
      }
      @if (inMore().length || extra()) {
        <button
          type="button"
          class="slot"
          [class.current]="activeInMore()"
          (click)="openMore()"
          aria-haspopup="dialog"
        >
          @if (activeInMore(); as l) {
            <span class="icon" aria-hidden="true">{{ l.icon || 'tab' }}</span>
            <span class="label">{{ short(l) }}</span>
          } @else {
            <span class="icon" aria-hidden="true">more_horiz</span>
            <span class="label">More</span>
          }
          @if (dot()) {
            <span class="dot" aria-label="Something new in More"></span>
          }
        </button>
      }
    </nav>

    <ng-template #moreSheet>
      <div class="sheet">
        @for (l of inMore(); track $index) {
          <a
            class="row"
            [routerLink]="l.link"
            [class.current]="$index + IN_BAR === active()"
            [attr.aria-current]="$index + IN_BAR === active() ? 'page' : null"
            (click)="closeMore()"
          >
            <span class="icon" aria-hidden="true">{{ l.icon || 'tab' }}</span>{{ l.label }}
          </a>
        }
        @if (extra(); as t) {
          <ng-container *ngTemplateOutlet="t; context: { $implicit: closeMore }" />
        }
      </div>
    </ng-template>
  `,
  styles: `
    :host {
      display: none;
      position: fixed;
      inset: auto 0 0 0;
      z-index: 100;
    }
    @media (max-width: 600px) {
      :host(:not(.framed)) {
        display: block;
      }
    }
    nav {
      display: flex;
      height: calc(56px + env(safe-area-inset-bottom));
      padding: 0 env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
      background: var(--app-card);
      border-top: 1px solid var(--app-line);
    }
    .slot {
      position: relative;
      flex: 1 1 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: 0;
      border: 0;
      background: none;
      color: var(--app-muted);
      font: var(--app-text-xs);
      font-size: 12px;
      text-decoration: none;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    /* Material Symbols ligatures: the text is the icon's name */
    .icon {
      font-family: 'Material Symbols Outlined';
      font-size: 24px;
      font-weight: normal;
      line-height: 1;
      letter-spacing: normal;
      white-space: nowrap;
      font-feature-settings: 'liga';
    }
    .slot .icon {
      display: grid;
      place-items: center;
      width: 56px;
      height: 28px;
      border-radius: 14px; /* Material 3 navigation bar: a pill behind the current link's icon */
    }
    .slot.current {
      color: var(--app-ink);
      font-weight: 600;
    }
    .slot.current .icon {
      background: color-mix(in srgb, var(--app-accent) 22%, transparent);
      color: var(--app-accent);
      font-variation-settings: 'FILL' 1;
    }
    .label {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dot {
      position: absolute;
      top: 8px;
      right: calc(50% - 22px);
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--app-warn);
    }
    .sheet {
      display: flex;
      flex-direction: column;
      padding: var(--app-space-2) 0 env(safe-area-inset-bottom);
    }
    .row {
      display: flex;
      align-items: center;
      gap: var(--app-space-4);
      min-height: 52px;
      padding: 0 var(--app-space-2);
      color: var(--app-ink);
      font: var(--app-text-md);
      font-size: 16px;
      text-decoration: none;
    }
    .row.current {
      color: var(--app-accent);
      font-weight: 600;
    }
  `,
})
export class BottomNav {
  readonly links = input.required<readonly NavLink[]>();
  readonly dot = input(false);
  protected readonly extra = contentChild(TemplateRef);
  protected readonly IN_BAR = IN_BAR;
  /** inside the wrapper (or any frame): the wrapper's own bar is there instead */
  protected readonly framed = window.parent !== window;

  private readonly sheet = inject(MatBottomSheet);
  private readonly moreSheet = viewChild.required<TemplateRef<unknown>>('moreSheet');
  protected readonly active = activeIndex(this.links);
  protected readonly inBar = computed(() => this.links().slice(0, IN_BAR));
  protected readonly inMore = computed(() => this.links().slice(IN_BAR));
  // when the current page is under More, the More slot shows it, so the bar always marks where you are
  protected readonly activeInMore = computed(() =>
    this.active() >= IN_BAR ? this.links()[this.active()] : undefined,
  );

  protected short(l: NavLink): string {
    return l.short || (l.label.length <= 10 ? l.label : l.label.split(/\s+/)[0]);
  }

  protected openMore(): void {
    this.sheet.open(this.moreSheet(), { ariaLabel: 'More pages' });
  }

  protected readonly closeMore = (): void => this.sheet.dismiss();
}
