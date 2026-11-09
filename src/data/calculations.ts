import type { Aggregation, AsadoPoint, MonthlyRate, Observation, PorcelPoint } from './model';

export const ASADO_BASE = '2016-04-01';

export function priceIndex(prices: Observation[], baseDate = ASADO_BASE): Observation[] {
  const validated = validateObservations(prices, 'asado');
  const base = validated.find(row => row.date === baseDate);
  if (!base) throw new Error(`Missing asado index base: ${baseDate}`);
  return validated.map(row => ({ date: row.date, value: 100 * row.value / base.value }));
}

export function withAsado(points: PorcelPoint[], prices: Observation[]): AsadoPoint[] {
  const indices = new Map(priceIndex(prices).map(row => [row.date, row.value]));
  const byDate = new Map(prices.map(row => [row.date, row.value]));
  return points.map(row => {
    const price = byDate.get(row.date) ?? null;
    return { ...row, asadoPrice: price, asadoKg: price == null ? null : row.ars / price, asadoIndex: indices.get(row.date) ?? null };
  });
}

export function validateObservations(rows: Observation[], id: string): Observation[] {
  if (!rows.length) throw new Error(`${id}: empty dataset`);
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date) || new Date(`${row.date}T00:00:00Z`).toISOString().slice(0, 10) !== row.date) throw new Error(`${id}: invalid date ${row.date}`);
    if (!Number.isFinite(row.value) || row.value <= 0) throw new Error(`${id}: invalid value on ${row.date}`);
    if (row.buy != null && (!Number.isFinite(row.buy) || row.buy <= 0)) throw new Error(`${id}: invalid buy price`);
    if (i && sorted[i - 1].date === row.date) throw new Error(`${id}: duplicate ${row.date}`);
  }
  return sorted;
}

export function nextMonth(month: string): string {
  const date = new Date(`${month.slice(0, 7)}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  return date.toISOString().slice(0, 10);
}

/** Preserve growth at overlapping months; no interpolation across absent CPI. */
export function linkCpi(sanLuis: Observation[], gba: Observation[], national: Observation[]): Observation[] {
  const maps = [sanLuis, gba, national].map(rows => new Map(rows.map(row => [row.date, row.value])));
  const last = national.at(-1)?.date;
  if (!last) throw new Error('National CPI is empty');
  const result: Observation[] = [{ date: '2012-10-01', value: 100 }];
  let previous = '2012-10-01';
  for (let date = nextMonth(previous); date <= last; date = nextMonth(date)) {
    const source = date <= '2016-04-01' ? maps[0] : date <= '2017-06-01' ? maps[1] : maps[2];
    const currentValue = source.get(date);
    const previousValue = source.get(previous);
    if (currentValue == null || previousValue == null || currentValue <= 0 || previousValue <= 0) throw new Error(`Missing CPI overlap at ${date}`);
    result.push({ date, value: result.at(-1)!.value * currentValue / previousValue });
    previous = date;
  }
  return result;
}

/** Means describe provider rows, including carried weekend quotes, not trading-day means. */
export function monthlyRates(rows: Observation[], asOf: string): MonthlyRate[] {
  const groups = new Map<string, Observation[]>();
  for (const row of rows) {
    const date = `${row.date.slice(0, 7)}-01`;
    // Never publish a partial current month as a complete monthly observation.
    if (nextMonth(date) > asOf.slice(0, 10)) continue;
    const group = groups.get(date) ?? [];
    group.push(row);
    groups.set(date, group);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => {
    values.sort((a, b) => a.date.localeCompare(b.date));
    const last = values.at(-1)!;
    return { date, close: last.value, mean: values.reduce((sum, row) => sum + row.value, 0) / values.length, count: values.length, quoteDate: last.date };
  });
}

export function porcel(cpi: Observation[], rates: MonthlyRate[], aggregation: Aggregation): PorcelPoint[] {
  const base = cpi.find(row => row.date === '2012-10-01');
  if (!base || base.value <= 0) throw new Error('Missing October 2012 CPI base');
  return salaryPoints(cpi.filter(row => row.date >= base.date).map(row => ({ date: row.date, value: 20_000 * row.value / base.value })), rates, aggregation);
}

/** Convert monthly nominal pay without inflation adjustment or imputed rates. */
export function salaryPoints(salary: Observation[], rates: MonthlyRate[], aggregation: Aggregation): PorcelPoint[] {
  const byDate = new Map(rates.map(row => [row.date, row]));
  return salary.map(row => {
    const rate = byDate.get(row.date);
    const ars = row.value;
    const exchange = rate?.[aggregation] ?? null;
    return { date: row.date, ars, usd: exchange == null ? null : ars / exchange, rate: exchange, count: rate?.count ?? 0, quoteDate: rate?.quoteDate ?? null };
  });
}

export function csv(rows: Record<string, unknown>[], columns: string[]): string {
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [columns.join(','), ...rows.map(row => columns.map(key => escape(row[key])).join(','))].join('\n') + '\n';
}
