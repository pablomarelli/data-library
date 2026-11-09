import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseAsadoRows, parseAsadoWorkbook } from '../scripts/parse-asado';
import { porcel, priceIndex, withAsado } from '../src/data/calculations';
import type { ChartInputs } from '../src/data/model';

const manifest = JSON.parse(readFileSync('data/snapshot.json', 'utf8'));
const input: ChartInputs = JSON.parse(readFileSync('public/data/chart-inputs.json', 'utf8'));

describe('Asado source and purchasing power', () => {
  it('parses the archived INDEC workbook and matches verified source values', () => {
    const prices = parseAsadoWorkbook(readFileSync(manifest.sources.asado.file));
    expect(prices).toEqual(input.asado);
    expect(prices[0]).toEqual({ date: '2016-04-01', value: 100.3 });
    expect(prices.find(row => row.date === '2023-12-01')?.value).toBe(5195.96);
    expect(prices.find(row => row.date === '2026-08-01')?.value).toBe(16736.73);
  });

  it('handles year header types, separators, and missing prices without filling them', () => {
    const rows = [
      ['Variedad', 'Unidad de medida', 'Año 2016', null, null, 2017, null],
      [null, null, ' Abril ', 'Mayo', null, 'Enero', 'Febrero'],
      ['Asado', 'kg', 100.3, null, null, 111.95, 120],
    ];
    expect(parseAsadoRows(rows)).toEqual([
      { date: '2016-04-01', value: 100.3 }, { date: '2017-01-01', value: 111.95 }, { date: '2017-02-01', value: 120 },
    ]);
    expect(() => parseAsadoRows([...rows.slice(0, 2), ['Asado', 'litro', 100.3]])).toThrow('unit');
    expect(() => parseAsadoRows([...rows.slice(0, 2), ['Asado', 'kg', '100,30']])).toThrow('nonnumeric');
  });

  it('uses a fixed observed base and preserves full precision', () => {
    const index = priceIndex(input.asado);
    expect(index[0].value).toBe(100);
    expect(index.find(row => row.date === '2026-08-01')!.value).toBeCloseTo(100 * 16736.73 / 100.3, 10);
    expect(() => priceIndex(input.asado.slice(1))).toThrow('Missing asado index base');
  });

  it('joins the same month, preserves missing prices, and is independent of dollar choice', () => {
    const prices = input.asado.filter(row => row.date !== '2020-01-01');
    const close = withAsado(porcel(input.cpi, input.rates['usd-blue'], 'close'), prices);
    const mean = withAsado(porcel(input.cpi, input.rates['usd-oficial'], 'mean'), prices);
    expect(close.map(row => row.asadoKg)).toEqual(mean.map(row => row.asadoKg));
    expect(close[0].asadoKg).toBeNull();
    expect(close.find(row => row.date === '2020-01-01')!.asadoKg).toBeNull();
    const august = close.find(row => row.date === '2026-08-01')!;
    expect(august.asadoKg).toBe(august.ars / 16736.73);
    expect(() => withAsado(close, [{ date: '2016-04-01', value: 0 }])).toThrow('invalid value');
  });
});
