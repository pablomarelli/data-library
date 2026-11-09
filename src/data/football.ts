export const footballLeagues: Record<string, { en: string; es: string }> = {
  GB1: { en: 'Premier League', es: 'Premier League' },
  ES1: { en: 'La Liga', es: 'La Liga' },
  IT1: { en: 'Serie A', es: 'Serie A' },
  L1: { en: 'Bundesliga', es: 'Bundesliga' },
  FR1: { en: 'Ligue 1', es: 'Ligue 1' },
};
export type FootballRow = {
  id: string; name: string; league: string; season: number;
  goals: number; assists: number; minutes: number; appearances: number;
  first: string; last: string;
};
export type FootballData = {
  retrievedAt: string; sourceUrl: string; sha256: string;
  first: string; last: string; rows: FootballRow[];
};
export type FootballPlayer = Omit<FootballRow, 'league' | 'season'> & { goals90: number; assists90: number };

/** Aggregate counts before division. Rates must share the same minutes denominator. */
export function footballPlayers(rows: FootballRow[], league: string, season: string, minimum: number): FootballPlayer[] {
  const players = new Map<string, Omit<FootballPlayer, 'goals90' | 'assists90'>>();
  for (const row of rows) {
    if ((league !== 'all' && row.league !== league) || (season !== 'all' && row.season !== Number(season))) continue;
    const prior = players.get(row.id);
    if (prior) {
      prior.goals += row.goals; prior.assists += row.assists; prior.minutes += row.minutes; prior.appearances += row.appearances;
      if (row.first < prior.first) prior.first = row.first;
      if (row.last > prior.last) prior.last = row.last;
    } else players.set(row.id, { id: row.id, name: row.name, goals: row.goals, assists: row.assists, minutes: row.minutes, appearances: row.appearances, first: row.first, last: row.last });
  }
  return [...players.values()].filter(row => row.minutes > 0 && row.minutes >= minimum)
    .map(row => ({ ...row, goals90: row.goals * 90 / row.minutes, assists90: row.assists * 90 / row.minutes }))
    .sort((a, b) => b.goals90 + b.assists90 - a.goals90 - a.assists90 || a.id.localeCompare(b.id));
}

/** Bubble area, not radius, is proportional to recorded minutes. */
export function footballRadius(minutes: number, maximum: number) { return 15 * Math.sqrt(minutes / maximum); }
