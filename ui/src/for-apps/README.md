# For the dashboards

Files here are meant to be copied into each dashboard app. The wrapper doesn't use them.

## route-reporter.ts: shareable deep links

DASHBOARD-REQUIREMENTS 3.7. The app tells the wrapper which page it's on, and the wrapper shows `/<tab id><that page>` in its address bar, so a copied link opens the same screen.

**Angular:** copy `route-reporter.ts` as is, then in `app.config.ts`:

```ts
providers: [provideRouteReporter(() => config.frameParents)];
```

Here `config` is what the app loaded from `/api/config`.

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
