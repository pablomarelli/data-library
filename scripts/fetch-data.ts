import { mkdir, writeFile, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { sources, type SnapshotManifest } from './sources';

const retrievedAt = new Date().toISOString();
const directory = `data/raw/${retrievedAt.replaceAll(':', '-')}`;
const manifest: SnapshotManifest = { retrievedAt, sources: {} as SnapshotManifest['sources'] };
const downloaded = await Promise.all(Object.entries(sources).map(async ([id, url]) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(90_000) });
  if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
  const content = Buffer.from(await response.arrayBuffer());
  const text = content.toString('utf8').trim();
  if (text.startsWith('<') || content.length < 100) throw new Error(`${id}: unexpected response`);
  const extension = id === 'salaryRegular' ? 'xlsx' : id === 'asado' ? 'xls' : text.startsWith('{') || text.startsWith('[') ? 'json' : 'csv';
  return { id: id as keyof typeof sources, content, url, file: `${directory}/${id}.${extension}` };
}));
await mkdir(directory, { recursive: true });
for (const item of downloaded) {
  await writeFile(item.file, item.content);
  manifest.sources[item.id] = { url: item.url, file: item.file, sha256: createHash('sha256').update(item.content).digest('hex') };
}
await writeFile(`${directory}/manifest.json`, JSON.stringify(manifest, null, 2));
await writeFile('data/snapshot.json.tmp', JSON.stringify(manifest, null, 2));
await rename('data/snapshot.json.tmp', 'data/snapshot.json');
console.log(`Saved immutable source snapshot: ${directory}. Run npm run data:build to validate and publish.`);
