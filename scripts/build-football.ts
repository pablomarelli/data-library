import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGzip, createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { footballLeagues, type FootballRow, type FootballData } from '../src/data/football';
import { csv } from '../src/data/calculations';

const sourceUrl = 'https://www.kaggle.com/api/v1/datasets/download/davidcariboo/player-scores/appearances.csv';
const retrievedAt = new Date().toISOString();
const directory = `data/football/${retrievedAt.replaceAll(':', '-')}`;
await mkdir(directory, { recursive: true });
const response = await fetch(sourceUrl);
if (!response.ok || !response.body) throw new Error(`Football download failed: ${response.status}`);
async function* chunks() {
  const reader = response.body!.getReader();
  try { while (true) { const { done, value } = await reader.read(); if (done) break; yield value; } }
  finally { reader.releaseLock(); }
}
await pipeline(Readable.from(chunks()), createGzip(), createWriteStream(`${directory}/appearances.csv.gz`));

function parseLine(line: string) {
  const values: string[] = []; let value = ''; let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { if (quoted && line[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (char === ',' && !quoted) { values.push(value); value = ''; } else value += char;
  }
  if (quoted) throw new Error('Football: unexpected multiline record');
  values.push(value); return values;
}
const stream = createReadStream(`${directory}/appearances.csv.gz`).pipe(createGunzip());
const hash = createHash('sha256'); stream.on('data', chunk => hash.update(chunk));
const lines = createInterface({ input: stream, crlfDelay: Infinity });
let columns: string[] | undefined;
const grouped = new Map<string, FootballRow>();
const seen = new Set<string>();
for await (const line of lines) {
  if (!columns) { columns = parseLine(line); for (const key of ['appearance_id', 'player_id', 'player_name', 'competition_id', 'date', 'goals', 'assists', 'minutes_played']) if (!columns.includes(key)) throw new Error(`Missing ${key}`); continue; }
  const values = parseLine(line);
  if (values.length !== columns.length) throw new Error('Football: invalid CSV width');
  const row = Object.fromEntries(columns.map((key, index) => [key, values[index]]));
  if (!footballLeagues[row.competition_id]) continue;
  if (seen.has(row.appearance_id)) throw new Error('Football: duplicate appearance');
  seen.add(row.appearance_id);
  const goals = Number(row.goals), assists = Number(row.assists), minutes = Number(row.minutes_played);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !row.player_id || !row.player_name || [row.goals, row.assists, row.minutes_played].some(v => v === '') || [goals, assists, minutes].some(v => !Number.isInteger(v) || v < 0)) throw new Error('Football: invalid observation');
  const season = Number(row.date.slice(0, 4)) - (Number(row.date.slice(5, 7)) < 7 ? 1 : 0);
  const key = `${row.player_id}/${row.competition_id}/${season}`;
  const prior = grouped.get(key);
  if (prior) { prior.goals += goals; prior.assists += assists; prior.minutes += minutes; prior.appearances++; if (row.date < prior.first) prior.first = row.date; if (row.date > prior.last) prior.last = row.date; }
  else grouped.set(key, { id: row.player_id, name: row.player_name, league: row.competition_id, season, goals, assists, minutes, appearances: 1, first: row.date, last: row.date });
}
const rows = [...grouped.values()].sort((a, b) => a.id.localeCompare(b.id) || a.season - b.season || a.league.localeCompare(b.league));
if (!rows.length) throw new Error('Football: empty dataset');
const data: FootballData = { retrievedAt, sourceUrl, sha256: hash.digest('hex'), first: rows.map(r => r.first).sort()[0], last: rows.map(r => r.last).sort().at(-1)!, rows };
await writeFile(`${directory}/manifest.json`, JSON.stringify({ ...data, rows: undefined, rawFile: `${directory}/appearances.csv.gz`, records: rows.length }, null, 2));
await writeFile('public/data/football.json', JSON.stringify(data));
await writeFile('public/data/football.csv', csv(rows, ['id', 'name', 'league', 'season', 'goals', 'assists', 'minutes', 'appearances', 'first', 'last']));
console.log(`${rows.length} player/league/season records: ${data.first} to ${data.last}`);
