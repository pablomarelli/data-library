import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { csv, linkCpi, monthlyRates, porcel, validateObservations } from '../src/data/calculations';
import type { ChartInputs, Series } from '../src/data/model';

const input: ChartInputs = JSON.parse(readFileSync('public/data/chart-inputs.json', 'utf8'));
const series = (id: string): Series => JSON.parse(readFileSync(`public/data/${id}.json`, 'utf8'));
describe('Economic calculations', () => {
  it('reproduces independently researched January 2025 CPI anchor without rounding', () => {
    const result = porcel(input.cpi, input.rates['usd-contadoconliqui'], 'close');
    expect(result[0].ars).toBe(20000);
    expect(result.find(row => row.date === '2025-01-01')!.ars).toBeCloseTo(5220330.271845, 4);
    expect(result.find(row => row.date === '2025-01-01')!.rate).toBe(1191);
    expect(result.find(row => row.date === '2025-01-01')!.usd).toBeCloseTo(5220330.271845 / 1191, 6);
  });
  it('leaves the 2012 CCL history missing instead of synthesizing rates', () => {
    const result = porcel(input.cpi, input.rates['usd-contadoconliqui'], 'close');
    expect(result.slice(0, 3).map(row => row.usd)).toEqual([null, null, null]);
    expect(result[3].usd).toBeGreaterThan(0);
  });
  it('links at overlapping index levels and rejects missing CPI months', () => {
    const sl = series('cpi-san-luis').observations;
    const gba = series('cpi-gba').observations;
    const national = series('cpi-national').observations;
    expect(linkCpi(sl, gba, national)).toEqual(input.cpi);
    expect(() => linkCpi(sl, gba.filter(row => row.date !== '2016-04-01'), national)).toThrow('Missing CPI overlap');
  });
  it('distinguishes quote means from last quotes and excludes incomplete months', () => {
    const rows = [{ date: '2025-01-30', value: 100 }, { date: '2025-01-31', value: 200 }, { date: '2025-02-01', value: 500 }];
    expect(monthlyRates(rows, '2025-02-02')).toEqual([{ date: '2025-01-01', mean: 150, close: 200, count: 2, quoteDate: '2025-01-31' }]);
  });
  it('retains interior missing exchange months', () => {
    const cpi = [{ date: '2012-10-01', value: 100 }, { date: '2012-11-01', value: 110 }, { date: '2012-12-01', value: 120 }];
    const rates = [{ date: '2012-10-01', close: 5, mean: 4, count: 1, quoteDate: '2012-10-31' }, { date: '2012-12-01', close: 6, mean: 5, count: 1, quoteDate: '2012-12-31' }];
    expect(porcel(cpi, rates, 'close').map(row => row.usd)).toEqual([4000, null, 4000]);
  });
  it('rejects duplicate, impossible, zero and nonfinite observations', () => {
    expect(() => validateObservations([{ date: '2025-02-30', value: 1 }], 'test')).toThrow('invalid date');
    expect(() => validateObservations([{ date: '2025-01-01', value: 0 }], 'test')).toThrow('invalid value');
    expect(() => validateObservations([{ date: '2025-01-01', value: NaN }], 'test')).toThrow('invalid value');
    expect(() => validateObservations([{ date: '2025-01-01', value: 1 }, { date: '2025-01-01', value: 2 }], 'test')).toThrow('duplicate');
  });
  it('exports nulls as empty fields and preserves numeric precision', () => {
    expect(csv([{ date: '2025-01', value: 1.23456789, missing: null }], ['date', 'value', 'missing'])).toContain('"2025-01","1.23456789",""');
  });
  it('retains historical reference currency units without a second austral conversion', () => {
    const reference = series('usd-reference');
    expect(reference.observations[0]).toEqual({ date: '1989-01-01', value: 0.00136655 });
    expect(reference.observations.find(row => row.date === '1993-01-01')!.value).toBeGreaterThan(0.9);
  });
});
