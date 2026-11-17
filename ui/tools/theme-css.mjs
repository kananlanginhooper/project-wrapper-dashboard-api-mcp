// Compiles the shared theme (src/styles/theme.scss) to plain CSS at src/for-apps/theme.css, for pages with no Sass
// build: the IdP's sign-in pages, the :8090 hub page, static Pages sites. Run by `npm run theme-css` after every
// theme.scss change, and commit both files together.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass';

const ui = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(ui, 'src', 'for-apps', 'theme.css');
const { css } = sass.compile(join(ui, 'src', 'styles', 'theme.scss'), {
  loadPaths: [join(ui, 'node_modules')],
  style: 'expanded',
});
const header = `/* GENERATED from project-wrapper-dashboard-api-mcp ui/src/styles/theme.scss by \`npm run theme-css\`: don't edit,
   copy it unchanged. The shared dashboard theme as plain CSS custom properties (--app-*, --mat-sys-*), light and dark
   following the system. Angular apps use theme.scss instead. */\n`;
const next = header + css + '\n';
const prev = (() => {
  try {
    return readFileSync(out, 'utf8');
  } catch {
    return '';
  }
})();
writeFileSync(out, next);
console.log(prev === next ? `${out}: unchanged` : `${out}: written (${next.length} bytes)`);
