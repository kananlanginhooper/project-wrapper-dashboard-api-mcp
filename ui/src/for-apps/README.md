# For the dashboards

The shared pieces every dashboard copies (DASHBOARD-REQUIREMENTS 5, UI library group A, decided 11-17). Copy a file unchanged; don't rebuild a piece per app. Every piece is a standalone Angular 20 component or directive: signals, OnPush, works zoneless, and uses only Angular, Material and CDK. The wrapper uses the tab strip, bottom nav and empty state itself, and shows all of them with made-up data at **`/_kit`** (on the laptop at http://localhost:8097/_kit, or on the Pages demo).

| File                | What it is                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `theme.css`         | The shared theme compiled to plain CSS, for pages with no Sass build. Angular apps keep using `theme.scss`. |
| `tab-nav.ts`        | `<app-tab-strip>`: a finger-draggable tab strip. `<app-bottom-nav>`: a phone bottom bar.                    |
| `tap-tooltip.ts`    | `appTapTooltip`: a matTooltip that also opens on a tap.                                                     |
| `stack-table.ts`    | `appStackTable`: a table that turns into cards at ≤600px.                                                   |
| `status.ts`         | `<app-stat-tile>`, `<app-pill>`, `<app-empty-state>`.                                                       |
| `chart-redraw.ts`   | `appChartRedraw`: keeps an ECharts chart sized inside a hidden or resized iframe.                           |
| `route-reporter.ts` | Shareable deep links (below).                                                                               |

The styles for tiles, pills, the empty state and the card table are plain classes in the shared theme: `.app-tile`, `.app-tiles`, `.app-pill`, `.app-empty`, `.app-stack-table`. They're in `theme.scss`, and so in `theme.css`. **Copy the current theme along with any piece.** A build-free page can use the classes directly, e.g. `<span class="app-pill" data-tone="ok">running</span>`.

## theme.css: the theme for pages with no Sass build

For the IdP's sign-in pages, the :8090 hub page, a taskrunner page and the rclone Pages sites.

- Copy the file next to the page and load it first: `<link rel="stylesheet" href="theme.css">`.
- Serve it from your own host, not from the wrapper: pages with a CSP stay self-hosted, and a page doesn't break when the wrapper is down.
- Light and dark follow the system. Set your accent after it: `:root { --app-accent: light-dark(#2f6f5e, #7cc4ae); }`.
- **Generated, don't edit.** In this repo, `npm run theme-css` rebuilds it from `src/styles/theme.scss`. Commit both together, and tell the Coordinator so the lanes re-copy.

## tab-nav.ts: tab strip and phone bottom nav

DASHBOARD-REQUIREMENTS 5a.

```ts
links: NavLink[] = [
  { link: '/overview', label: 'Overview', icon: 'dashboard' },
  { link: '/jobs', label: 'Jobs', icon: 'work', tooltip: 'Every job on every host' },
];
```

```html
<header><span class="brand">…</span><app-tab-strip [links]="links" /></header>
<router-outlet />
<app-bottom-nav [links]="links" />
```

**`<app-tab-strip>`:**

- It has no paging arrows and scrolls by finger or wheel. It needs the strip rule in the shared theme.
- It keeps the current tab in view after each navigation and resize.
- The current tab is the link the URL is under, so `/jobs/42` marks Jobs.
- Size it from outside: `app-tab-strip { flex: 1; --mat-tab-container-height: 48px }`.

**`<app-bottom-nav>`:**

- Shows only at ≤600px, and **hides itself inside the wrapper**, which already has a bottom bar there. You only see it when the app is opened on its own.
- The first four links get a slot each; the rest go under More.
- Icons are Material Symbols names, so the app needs the `material-symbols` font (`node_modules/material-symbols/outlined.css` under `styles` in angular.json).
- Extra rows for the More sheet go in an `<ng-template let-close>` inside it; call `close()` to dismiss the sheet. `[dot]="true"` marks the More slot.
- Pad the page's bottom by `calc(56px + env(safe-area-inset-bottom))` at ≤600px when not framed.

## tap-tooltip.ts

`<button appTapTooltip="Restart the job">`. Hover and focus work as with matTooltip; on a phone, a tap shows the tooltip for 2.5 s, or until the next tap. `appTapTooltipPosition` and `appTapTooltipDisabled` pass through to matTooltip. The tap still does what the element does, so on a link the tooltip is only for detail.

## stack-table.ts

`<table mat-table appStackTable …>`. At ≤600px each row becomes a card with `Column: value` lines.

- The labels come from the header row: matched by column name on mat-table, by position on a plain table. They update when rows change.
- Set `data-label` on a cell yourself to override its label.
- Header-less columns (actions) show without a label.
- The header row is hidden on a phone, so MatSort's headers are too. Put a sort select above the table if a phone needs sorting.
- Sticky headers: `*matHeaderRowDef="cols; sticky: true"` inside a box with a `max-height` and `overflow: auto`.

## status.ts

```html
<div class="app-tiles">
  <app-stat-tile label="Queue" [value]="812" unit="files" hint="waiting on upload" tone="warn">
    <div
      spark
      echarts
      [options]="spark()"
      (chartInit)="sparkChart.set($event)"
      [appChartRedraw]="sparkChart()"
    ></div>
  </app-stat-tile>
</div>
<app-pill tone="ok">running</app-pill>
<app-empty-state message="No jobs yet" icon="inbox"
  ><button mat-button>Add one</button></app-empty-state
>
```

Tones are `ok`, `warn`, `bad`, or none for neutral. A sparkline is optional: any element with the `spark` attribute, 32px high.

## chart-redraw.ts

A tab the wrapper isn't showing gets no animation frames. ngx-echarts' `autoResize` waits for one, so a chart drawn or resized while hidden stays the wrong size, often 0 wide. This directive calls `resize()` from a ResizeObserver, at the first frame after the box gets its size, and again on `visibilitychange`.

```html
<div
  echarts
  [options]="opts()"
  [autoResize]="false"
  (chartInit)="chart.set($event)"
  [appChartRedraw]="chart()"
></div>
```

In the component: `chart = signal<Resizable | undefined>(undefined)`. Give the div a CSS height. The directive takes anything with `resize()`, so it doesn't import ECharts.

## route-reporter.ts: shareable deep links

DASHBOARD-REQUIREMENTS 3.7. The app tells the wrapper which page it's on, and the wrapper shows `/<tab id><that page>` in its address bar, so a copied link opens the same screen.

**Angular:** copy `route-reporter.ts` as is, then in `app.config.ts`:

```ts
providers: [provideRouteReporter(() => config.frameParents)];
```

Here `config` is what the app loaded from `/api/config`.

An app on `withHashLocation` reports `/#` + its route (`/#/c/650?t=54`); the helper does that itself.

**Anything else:** after each in-app navigation, run:

```js
const parent =
  location.ancestorOrigins?.[0] ?? (document.referrer && new URL(document.referrer).origin);
if (window.parent !== window && parent && frameParents.includes(parent))
  window.parent.postMessage(
    { type: 'route', path: pathRelativeToBase + location.search + location.hash },
    parent,
  );
```

### What the wrapper does with it

- It accepts the message only from the open tab's iframe, at the tab URL's origin.
- `path` must start with exactly one `/`, and contain no `\` and no whitespace.
- It then changes the address bar only, with `history.replaceState`. The app isn't reloaded.
- `/<id>/<page>` opened fresh (a shared link, or Back to one) loads the iframe at the tab URL plus `<page>`, query and hash. Then **the app must open its own deep links directly**: every route works on a fresh load at that path.
- ↗ ("open on its own") opens the current page too.
- An app that doesn't report still works. Its links just stop at the tab.
