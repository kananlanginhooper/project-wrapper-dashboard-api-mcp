import { Injectable, signal } from '@angular/core';
import { Tab, TabList } from './models';

const POLL_MS = 30_000;

/** The tab list, re-read every 30 s and when the window regains focus, so a new dashboard appears without a reload. */
@Injectable({ providedIn: 'root' })
export class TabsService {
  readonly tabs = signal<Tab[]>([]);
  readonly loaded = signal(false);
  readonly error = signal('');

  constructor() {
    this.load();
    setInterval(() => this.load(), POLL_MS);
    window.addEventListener('focus', () => this.load());
  }

  async load(): Promise<void> {
    try {
      const r = await fetch('api/tabs', { cache: 'no-store' }); // relative to <base href>, so a path prefix just works
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const next = ((await r.json()) as TabList).tabs ?? [];
      // keep the old array when nothing changed, so iframes aren't reloaded on every poll
      if (JSON.stringify(next) !== JSON.stringify(this.tabs())) this.tabs.set(next);
      this.error.set('');
    } catch (e) {
      this.error.set('tab list unreachable: ' + (e instanceof Error ? e.message : e));
    }
    this.loaded.set(true);
  }

  byId(id: string): Tab | undefined {
    return this.tabs().find((t) => t.id === id);
  }
}
