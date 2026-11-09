/** Import upstream registry source verbatim, with a provenance manifest. */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';

const seen = new Set<string>();
const packages = new Set<string>();
const manifest: { url: string; sha256: string }[] = [];
async function install(name: string) {
  if (seen.has(name)) return;
  seen.add(name);
  const url = `https://bklit.com/r/${name}.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const text = await response.text();
  const item = JSON.parse(text) as { dependencies?: string[]; registryDependencies?: string[]; files: { path: string; content: string; target?: string }[] };
  manifest.push({ url, sha256: createHash('sha256').update(text).digest('hex') });
  for (const dep of item.dependencies ?? []) packages.add(dep);
  for (const dep of item.registryDependencies ?? []) {
    if (!dep.startsWith('@bklit/')) throw new Error(`Inspect registry dependency: ${dep}`);
    await install(dep.replace('@bklit/', ''));
  }
  for (const file of item.files) {
    // Preserve relative imports, while keeping chart code under one vendor directory.
    const target = file.path.startsWith('src/charts/')
      ? file.path.replace('src/charts/', 'src/vendor/bklit/')
      : file.path.includes('shimmering-text') ? 'src/vendor/shimmering-text.tsx'
      : file.path.endsWith('utils.ts') ? 'src/lib/utils.ts'
      : `src/vendor/bklit/${file.path.split('/').at(-1)}`;
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.content);
  }
}
await install('line-chart');
await install('y-axis');
await mkdir('src/vendor/bklit', { recursive: true });
await writeFile('src/vendor/bklit/PROVENANCE.json', JSON.stringify({ retrievedAt: new Date().toISOString(), source: 'https://github.com/bklit/bklit-ui', registry: manifest }, null, 2));
const license = await fetch('https://raw.githubusercontent.com/bklit/bklit-ui/main/LICENSE');
if (!license.ok) throw new Error('Missing upstream licence');
await writeFile('src/vendor/bklit/LICENSE', await license.text());
console.log('Required packages:', [...packages].join(' '));
console.log('Imported registry items:', seen.size);
