import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { footballPlayers, footballRadius, type FootballData, type FootballRow } from '../src/data/football';

const row: FootballRow = { id: '1', name: 'Player', league: 'ES1', season: 2020, goals: 10, assists: 5, minutes: 900, appearances: 12, first: '2020-08-01', last: '2021-05-01' };
describe('football rates and coverage', () => {
  it('divides aggregated counts by the same minutes rather than averaging rates', () => {
    const result = footballPlayers([row, { ...row, season: 2021, minutes: 1800, goals: 2, assists: 1 }], 'all', 'all', 900)[0];
    expect(result.goals90).toBe(12 * 90 / 2700);
    expect(result.assists90).toBe(6 * 90 / 2700);
    expect(row.minutes).toBe(900);
  });
  it('filters leagues, seasons, zero minutes, and thresholds', () => {
    expect(footballPlayers([row], 'GB1', 'all', 900)).toEqual([]);
    expect(footballPlayers([row], 'all', '2021', 900)).toEqual([]);
    expect(footballPlayers([row], 'ES1', '2020', 901)).toEqual([]);
    expect(footballPlayers([{ ...row, minutes: 0 }], 'all', 'all', 0)).toEqual([]);
  });
  it('makes bubble area proportional to minutes', () => {
    expect(footballRadius(400, 1600) ** 2 / footballRadius(1600, 1600) ** 2).toBe(.25);
  });
  it('publishes finite nonnegative observations and reproducible Messi totals', () => {
    const data: FootballData = JSON.parse(readFileSync('public/data/football.json', 'utf8'));
    expect(data.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(data.last).toBe('2026-05-24');
    expect(new Set(data.rows.map(r => `${r.id}/${r.league}/${r.season}`)).size).toBe(data.rows.length);
    for (const r of data.rows) for (const key of ['goals', 'assists', 'minutes', 'appearances'] as const) expect(Number.isInteger(r[key]) && r[key] >= 0).toBe(true);
    const messi = footballPlayers(data.rows, 'all', 'all', 9000).find(p => p.id === '28003')!;
    const source = data.rows.filter(r => r.id === messi.id);
    expect(messi.goals).toBe(source.reduce((sum, r) => sum + r.goals, 0));
    expect(messi.goals90).toBe(messi.goals * 90 / messi.minutes);
    expect(messi.last <= '2023-06-30').toBe(true);
  });
});
