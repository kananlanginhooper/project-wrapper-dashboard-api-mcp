import { Injectable, signal } from '@angular/core';

/** One row of GET api/tabs: a dashboard shown in an iframe. */
export interface Tab {
  id: string;            // URL path segment: /<id>
  title: string;         // nav label
  url: string;           // the app's own address, loaded in the iframe
  order: number;
  description?: string;  // nav tooltip
}

/** The tab list, re-read every 30 s and when the window regains focus, so a new dashboard appears without a reload. */
@Injectable({ providedIn: 'root' })
export class Tabs {
  readonly tabs = signal<Tab[]>([]);
  readonly loaded = signal(false);
  readonly error = signal('');

  constructor() {
    this.load();
    setInterval(() => this.load(), 30000);
    window.addEventListener('focus', () => this.load());
  }

  async load() {
    try {
      const r = await fetch('api/tabs', { cache: 'no-store' });   // relative to <base href>, so a path prefix just works
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const next: Tab[] = (await r.json()).tabs || [];
      // keep the old array when nothing changed, so iframes aren't reloaded on every poll
      if (JSON.stringify(next) !== JSON.stringify(this.tabs())) this.tabs.set(next);
      this.error.set('');
    } catch (e) {
      this.error.set('tab list unreachable: ' + (e instanceof Error ? e.message : e));
    }
    this.loaded.set(true);
  }
}
