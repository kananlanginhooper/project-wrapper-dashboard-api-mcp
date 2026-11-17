import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { ChartRedraw, Resizable } from '../../../for-apps/chart-redraw';
import { StackTable } from '../../../for-apps/stack-table';
import { EmptyState, StatTile, StatusPill, Tone } from '../../../for-apps/status';
import { TapTooltip } from '../../../for-apps/tap-tooltip';

interface Job {
  name: string;
  host: string;
  state: string;
  tone: Tone;
  files: number;
}

const JOBS: Job[] = [
  { name: 'photo carve', host: 'server A', state: 'running', tone: 'ok', files: 41230 },
  { name: 'offsite push', host: 'server B', state: 'waiting', tone: 'warn', files: 812 },
  { name: 'video transcode', host: 'server A', state: 'failed', tone: 'bad', files: 17 },
  { name: 'thumbnails', host: 'desktop', state: 'done', tone: '', files: 9904 },
];

/** The shared pieces in src/for-apps, on one page with made-up data: /_kit (not linked from the nav). For
 *  checking them while they change and for the dashboards to look at before copying. */
@Component({
  selector: 'app-kit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    StackTable,
    StatTile,
    StatusPill,
    EmptyState,
    TapTooltip,
    ChartRedraw,
  ],
  template: `
    <h1>Shared pieces</h1>
    <p class="muted">src/for-apps in the wrapper repo. Made-up data.</p>

    <h2>Stat tiles</h2>
    <div class="app-tiles">
      <app-stat-tile label="Files carved" [value]="'41,230'" hint="+1,200 today" tone="ok" />
      <app-stat-tile
        label="Queue"
        [value]="812"
        unit="files"
        hint="waiting on upload"
        tone="warn"
      />
      <app-stat-tile label="Failed" [value]="17" tone="bad" />
      <app-stat-tile label="Power" [value]="612" unit="W">
        <div spark [appChartRedraw]="spark()" class="fake-chart"></div>
      </app-stat-tile>
    </div>

    <h2>Status pills</h2>
    <p class="row">
      <app-pill tone="ok">running</app-pill>
      <app-pill tone="warn">waiting</app-pill>
      <app-pill tone="bad">failed</app-pill>
      <app-pill>done</app-pill>
    </p>

    <h2>Tap tooltip</h2>
    <p class="row">
      <button mat-stroked-button appTapTooltip="Tap again or wait 2.5 s to close">
        Tap or hover me
      </button>
      <span appTapTooltip="Plain text works too" class="dotted">what's this?</span>
    </p>

    <h2>Table that stacks into cards (≤600px)</h2>
    <div class="table-box">
      <table mat-table appStackTable [dataSource]="rows()" matSort (matSortChange)="sort($event)">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Job</th>
          <td mat-cell *matCellDef="let r">{{ r.name }}</td>
        </ng-container>
        <ng-container matColumnDef="host">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Host</th>
          <td mat-cell *matCellDef="let r">{{ r.host }}</td>
        </ng-container>
        <ng-container matColumnDef="state">
          <th mat-header-cell *matHeaderCellDef>State</th>
          <td mat-cell *matCellDef="let r">
            <app-pill [tone]="r.tone">{{ r.state }}</app-pill>
          </td>
        </ng-container>
        <ng-container matColumnDef="files">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Files</th>
          <td mat-cell *matCellDef="let r" class="num">{{ r.files.toLocaleString() }}</td>
        </ng-container>
        <ng-container matColumnDef="act">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let r"><button mat-button>Open</button></td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols; sticky: true"></tr>
        <tr mat-row *matRowDef="let r; columns: cols"></tr>
      </table>
    </div>

    <h2>Chart redraw</h2>
    <p class="muted">
      A stand-in chart that prints its size each time it's redrawn. Resize the window, or switch to
      another tab and back: it follows even when the tab was hidden.
    </p>
    <div class="big-chart fake-chart" [appChartRedraw]="chart()"></div>

    <h2>Empty state</h2>
    <app-empty-state message="No jobs yet" icon="inbox"
      ><button mat-button>Add one</button></app-empty-state
    >
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      overflow: auto;
      padding: var(--app-space-4);
      max-width: 1100px;
      margin: 0 auto;
    }
    h1 {
      font: var(--app-text-xl);
    }
    h2 {
      margin: var(--app-space-5) 0 var(--app-space-2);
      font: var(--app-text-lg);
    }
    .muted {
      color: var(--app-muted);
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--app-space-3);
    }
    .dotted {
      border-bottom: 1px dotted var(--app-muted);
      cursor: help;
    }
    .table-box {
      max-height: 220px;
      overflow: auto;
    }
    table {
      width: 100%;
    }
    .num {
      font-variant-numeric: tabular-nums;
    }
    .fake-chart {
      display: grid;
      place-items: center;
      border: 1px dashed var(--app-line);
      border-radius: var(--app-radius-s);
      color: var(--app-muted);
      font: var(--app-text-xs);
    }
    .big-chart {
      height: 160px;
    }
  `,
})
export class KitPage {
  protected readonly cols = ['name', 'host', 'state', 'files', 'act'];
  protected readonly rows = signal(JOBS);
  protected readonly chart = signal<Resizable | undefined>(undefined);
  protected readonly spark = signal<Resizable | undefined>(undefined);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    // what (chartInit)="chart.set($event)" does with a real ECharts div
    afterNextRender(() => {
      const [spark, big] = this.host.querySelectorAll<HTMLElement>('.fake-chart');
      this.spark.set(fakeChart(spark));
      this.chart.set(fakeChart(big));
    });
  }

  protected sort(s: Sort): void {
    const k = s.active as keyof Job;
    const dir = s.direction === 'desc' ? -1 : 1;
    this.rows.set(
      s.direction ? [...JOBS].sort((a, b) => (a[k] > b[k] ? dir : a[k] < b[k] ? -dir : 0)) : JOBS,
    );
  }
}

/** A stand-in for an ECharts instance: resize() writes the box's size and a count into it. */
function fakeChart(el: HTMLElement): Resizable {
  let n = 0;
  return {
    resize: () => {
      el.textContent = `redraw ${++n}: ${el.offsetWidth}×${el.offsetHeight}`;
    },
  };
}
