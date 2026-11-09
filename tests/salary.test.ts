import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseSalaryCsv, parseRegularSalary } from '../scripts/parse-salary';
import { salaryPoints, withAsado } from '../src/data/calculations';
import type { ChartInputs } from '../src/data/model';

const manifest = JSON.parse(readFileSync('data/snapshot.json', 'utf8'));
const inputs: ChartInputs = JSON.parse(readFileSync('public/data/chart-inputs.json', 'utf8'));

describe('Reported average salary', () => {
  it('extracts the official regular estimate rather than total pay or trend-cycle', () => {
    const regular = parseRegularSalary(readFileSync(manifest.sources.salaryRegular.file));
    expect(regular).toEqual(inputs.salaryRegular);
    expect(regular[0]).toEqual({ date: '1995-01-01', value: 829.1864827440306 });
    expect(regular.find(row => row.date === '2002-01-01')?.value).toBe(795.2442712463715);
    expect(regular.find(row => row.date === '2026-06-01')?.value).toBe(2184021.058534571);
    const converted = withAsado(salaryPoints(regular, inputs.rates['usd-blue'], 'close'), inputs.asado);
    expect(converted.at(-1)?.date).toBe(regular.at(-1)?.date);
    const june = converted.find(row => row.date === '2026-06-01')!;
    expect(june.ars).toBe(2184021.058534571);
    expect(june.asadoKg).toBe(june.ars / inputs.asado.find(row => row.date === june.date)!.value);
  });
  it('imports the mean rather than median and preserves reported bonuses and precision', () => {
    const salary = parseSalaryCsv(readFileSync(manifest.sources.salary.file, 'utf8'));
    expect(salary).toEqual(inputs.salary);
    expect(salary[0]).toEqual({ date: '1995-01-01', value: 885.22 });
    expect(salary.find(row => row.date === '2026-06-01')?.value).toBe(3183685.81);
    expect(salary.find(row => row.date === '2026-07-01')?.value).toBe(2256861.1202040724);
  });
  it('finds columns by name and rejects malformed source data', () => {
    expect(parseSalaryCsv('asalariados_priv_remuneracion_promedio,indice_tiempo,asalariados_priv_remuneracion_mediana\n1000.123456,2020-01-01,700')).toEqual([{ date: '2020-01-01', value: 1000.123456 }]);
    expect(() => parseSalaryCsv('indice_tiempo,asalariados_priv_remuneracion_mediana\n2020-01-01,700')).toThrow('average column');
    expect(() => parseSalaryCsv('indice_tiempo,asalariados_priv_remuneracion_promedio\n2020-01-01,')).toThrow('invalid value');
  });
  it('converts reported nominal salary, without CPI adjustment or filling denominators', () => {
    const points = withAsado(salaryPoints(inputs.salary, inputs.rates['usd-contadoconliqui'], 'close'), inputs.asado);
    expect(points[0]).toMatchObject({ ars: 885.22, usd: null, asadoKg: null });
    const july = points.find(row => row.date === '2026-07-01')!;
    const price = inputs.asado.find(row => row.date === july.date)!.value;
    const rate = inputs.rates['usd-contadoconliqui'].find(row => row.date === july.date)!.close;
    expect(july.ars).toBe(2256861.1202040724);
    expect(july.usd).toBe(july.ars / rate);
    expect(july.asadoKg).toBe(july.ars / price);
    expect(points.at(-1)!.date).toBe(inputs.salary.at(-1)!.date);
    const means = withAsado(salaryPoints(inputs.salary, inputs.rates['usd-blue'], 'mean'), inputs.asado);
    expect(means.map(row => row.asadoKg)).toEqual(points.map(row => row.asadoKg));
  });
});
