import { Location } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { Tab } from './models';

/** The page open inside the current tab (path + query + hash, relative to the app's own URL), so the address bar and
 *  ↗ point at it and a copied link opens the same screen (DASHBOARD-REQUIREMENTS 3.7). Apps report it with the
 *  helper in src/for-apps. */
@Injectable({ providedIn: 'root' })
export class FrameRoute {
  private readonly location = inject(Location);
  readonly current = signal<{ id: string; path: string } | null>(null);

  /** The app's URL for a tab: at its current page when it's the open tab, else its root. */
  urlFor(tab: Tab): string {
    const c = this.current();
    return c?.id === tab.id ? appUrl(tab.url, c.path) : tab.url;
  }

  /** The app in tab `id` moved to `path`: show it in the address bar. An address change only (no router navigation,
   *  so the iframe stays put), and replace, not push: the iframe's own navigation already made the Back entry. */
  report(id: string, path: unknown): void {
    if (!isAppPath(path)) return;
    this.current.set({ id, path });
    this.location.replaceState(`/${id}${path === '/' ? '' : path}`, '', this.location.getState());
  }
}

/** A path inside the app: one leading slash, then no backslash or whitespace anywhere, so never //host, \\host, a
 *  scheme or a full URL. */
export function isAppPath(p: unknown): p is string {
  return typeof p === 'string' && p.length <= 2000 && /^\/(?![/\\])[^\\\s]*$/.test(p);
}

/** The page a wrapper URL points at inside tab `id`: /media/albums?x#y gives /albums?x#y, and for a hash-routed app
 *  /copilot/#/c/650?t=54 gives /#/c/650?t=54; bare /media gives ''. `url` is the router's; the hash is taken raw
 *  from the address bar, because the router re-encodes its fragment. */
export function restOf(url: string, id: string, hash = location.hash): string {
  const i = url.indexOf('#');
  const route = i < 0 ? url : url.slice(0, i);
  const frag = i < 0 ? '' : hash;
  let rest = '';
  if (route.startsWith(`/${id}/`)) rest = route.slice(id.length + 1) + frag;
  else if (route === `/${id}` && frag) rest = '/' + frag; // the router drops the slash in /copilot/#/...
  return isAppPath(rest) ? rest : '';
}

/** The tab URL with an app path on it: http://h/app/ + /albums?x#y gives http://h/app/albums?x#y. The hash is kept
 *  exactly as sent (a hash-routed app's whole page lives there). */
export function appUrl(base: string, path: string): string {
  if (!path) return base;
  const i = path.indexOf('#');
  const hash = i < 0 ? '' : path.slice(i);
  const u = new URL(base, document.baseURI);
  const p = new URL(i < 0 ? path : path.slice(0, i), 'http://x');
  u.pathname = u.pathname.replace(/\/+$/, '') + p.pathname;
  u.search = p.search;
  u.hash = '';
  return u.href + hash;
}
