import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** ok = green, warn = amber, bad = red; '' = neutral. */
export type Tone = 'ok' | 'warn' | 'bad' | '';

// Stat tile, status pill and empty state. Copy this file into an app as is; the styles are the .app-tile, .app-pill
// and .app-empty classes in the shared theme (theme.scss, or theme.css on a page with no Sass build).

/** A status pill: <app-pill tone="ok">running</app-pill>. */
@Component({
  selector: 'app-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="app-pill" [attr.data-tone]="tone() || null"><ng-content /></span>`,
})
export class StatusPill {
  readonly tone = input<Tone>('');
}

/** A stat tile: label, big value (+ unit), optional hint, and an optional sparkline projected with the `spark`
 *  attribute (an ECharts div with the appChartRedraw directive, an SVG, ...). Put a row of them in a
 *  <div class="app-tiles">.
 *
 *    <app-stat-tile label="Queue" [value]="queue()" unit="files" hint="+30 in the last hour" tone="warn">
 *      <div spark echarts [options]="queueSpark()" ...></div>
 *    </app-stat-tile> */
@Component({
  selector: 'app-stat-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-tile" [attr.data-tone]="tone() || null">
      <span class="label" [title]="label()">{{ label() }}</span>
      <span class="value"
        >{{ value() }}
        @if (unit()) {
          <small>{{ unit() }}</small>
        }
      </span>
      @if (hint()) {
        <span class="hint">{{ hint() }}</span>
      }
      <div class="spark-slot"><ng-content select="[spark]" /></div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .spark-slot:empty {
      display: none;
    }
  `,
})
export class StatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string | number | null>();
  readonly unit = input<string>('');
  readonly hint = input<string>('');
  readonly tone = input<Tone>('');
}

/** A quiet centered "nothing here" message, an optional Material Symbols icon above it, and anything projected
 *  (a button) below: <app-empty-state message="No jobs yet" icon="inbox"><button mat-button>Add one</button></app-empty-state> */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-empty">
      @if (icon()) {
        <span class="icon" aria-hidden="true">{{ icon() }}</span>
      }
      <p>{{ message() }}</p>
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class EmptyState {
  readonly message = input.required<string>();
  readonly icon = input<string>('');
}
