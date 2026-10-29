// GitHub Pages demo: copies the demo build to ../docs and adds the static stand-ins for the API.
// Run by `npm run build:demo`. No back end: api/tabs and api/config are plain files, and every tab is a public page.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const build = join(here, '..', 'dist', 'demo', 'browser');
const docs = join(here, '..', '..', 'docs');
if (!existsSync(join(build, 'index.html'))) throw new Error(`no demo build at ${build}`);

rmSync(docs, { recursive: true, force: true });
cpSync(build, docs, { recursive: true });
cpSync(join(here, 'about.html'), join(docs, 'about.html'));
mkdirSync(join(docs, 'api'), { recursive: true });
cpSync(join(here, 'tabs.json'), join(docs, 'api', 'tabs'));
writeFileSync(join(docs, 'api', 'config'), JSON.stringify({
  apiBase: 'api/', basePath: '/project-wrapper-dashboard-api-mcp/', publicUrl: 'https://kananlanginhooper.github.io/project-wrapper-dashboard-api-mcp',
  frameParents: [], login: { enabled: false, issuer: '', clientId: '' },
}));
// Pages has no SPA fallback: a deep link like /game-plan serves 404.html, which is the app itself
writeFileSync(join(docs, '404.html'), readFileSync(join(docs, 'index.html')));
writeFileSync(join(docs, '.nojekyll'), '');
console.log(`demo written to ${docs}`);
