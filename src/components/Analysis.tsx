import { lazy, Suspense, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, ChevronDown, Info } from 'lucide-react';
import type { Aggregation, ChartInputs, Language } from '../data/model';
import { csv, porcel, salaryPoints, withAsado } from '../data/calculations';
import { analysisCopy, regularSalarySource, salarySource, type AnalysisKind, type SalaryBasis } from '../analysisCopy';
import { month, number, text } from '../i18n';
import Methodology from './Methodology';
import SalaryMethodology from './SalaryMethodology';
import { useData } from '../data/useData';

const EconomicChart = lazy(() => import('./EconomicChart'));
const names: Record<string, string> = { 'usd-contadoconliqui': 'CCL', 'usd-oficial': 'Oficial', 'usd-blue': 'Blue', 'usd-bolsa': 'MEP', 'usd-mayorista': 'Mayorista', 'usd-tarjeta': 'Tarjeta', 'usd-cripto': 'Cripto' };
export const rateName = (id: string, language: Language) => language === 'es' ? names[id] : ({ 'usd-oficial': 'Official', 'usd-mayorista': 'Wholesale', 'usd-tarjeta': 'Card', 'usd-cripto': 'Crypto' }[id] ?? names[id]);

function download(content: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function LoadState({ error, retry, language }: { error: boolean; retry?: () => void; language: Language }) {
  const t = text[language];
  return <div className="load-state" role={error ? 'alert' : 'status'}><p>{error ? t.error : t.loading}</p>{error && <button className="button" onClick={retry}>{t.retry}</button>}</div>;
}

export default function Analysis({ language, dark, kind = 'porcel' }: { language: Language; dark: boolean; kind?: AnalysisKind }) {
  const state = useData<ChartInputs>('/data/chart-inputs.json');
  const [basis, setBasis] = useState<SalaryBasis>(new URLSearchParams(location.search).get('pay') === 'total' ? 'total' : 'regular');
  const changeBasis = (value: SalaryBasis) => {
    const url = new URL(location.href);
    url.searchParams.set('pay', value);
    url.searchParams.delete('from');
    url.searchParams.delete('to');
    history.replaceState(null, '', url);
    setBasis(value);
  };
  return state.data ? <AnalysisContent key={`${kind}-${basis}`} inputs={state.data} language={language} dark={dark} kind={kind} basis={basis} onBasisChange={changeBasis} /> : <LoadState error={state.error} retry={state.retry} language={language} />;
}

function AnalysisContent({ inputs, language, dark, kind, basis, onBasisChange }: { inputs: ChartInputs; language: Language; dark: boolean; kind: AnalysisKind; basis: SalaryBasis; onBasisChange: (value: SalaryBasis) => void }) {
  const t = analysisCopy(language, kind, basis);
  const salary = kind === 'salary';
  const regular = salary && basis === 'regular';
  const source = salary ? (regular ? inputs.salaryRegular : inputs.salary) : inputs.cpi;
  const salaryId = regular ? 'salary-private-regular' : 'salary-private-gross';
  const initial = new URLSearchParams(window.location.search);
  const [rate, setRate] = useState(initial.get('rate') && names[initial.get('rate')!] ? initial.get('rate')! : 'usd-contadoconliqui');
  const [aggregation, setAggregation] = useState<Aggregation>(initial.get('aggregation') === 'mean' ? 'mean' : 'close');
  const [showAsado, setShowAsado] = useState(initial.get('asado') === '1' || (salary && initial.get('asado') !== '0'));
  const min = source[0].date.slice(0, 7);
  const max = source.at(-1)!.date.slice(0, 7);
  const validMonth = (value: string | null) => value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && value >= min && value <= max ? value : null;
  const [customStart, setStart] = useState(validMonth(initial.get('from')));
  const [customEnd, setEnd] = useState(validMonth(initial.get('to')));
  const [selected, setSelected] = useState<string | null>(null);
  const allPoints = useMemo(() => withAsado(salary ? salaryPoints(source, inputs.rates[rate] ?? [], aggregation) : porcel(inputs.cpi, inputs.rates[rate] ?? [], aggregation), inputs.asado), [inputs, source, rate, aggregation, salary]);
  const sharedPoints = useMemo(() => allPoints.filter(row => row.usd != null && (!showAsado || row.asadoKg != null)), [allPoints, showAsado]);
  const start = customStart ?? sharedPoints[0]?.date.slice(0, 7) ?? min;
  const end = customEnd ?? sharedPoints.at(-1)?.date.slice(0, 7) ?? max;
  const points = useMemo(() => allPoints.filter(row => row.date.slice(0, 7) >= start && row.date.slice(0, 7) <= end), [allPoints, start, end]);
  const current = points.find(row => row.date === selected) ?? points.at(-1);
  const validRange = start < end && points.length > 1;
  const setQuery = (key: string, value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState(null, '', url);
  };
  const setRange = (years: number | null) => {
    const from = years ? [`${Number(max.slice(0, 4)) - years}${max.slice(4)}`, min].sort().at(-1)! : min;
    setStart(from); setEnd(max); setQuery('from', from); setQuery('to', max);
  };
  const exportData = () => download(csv(points.map(row => ({ month: row.date.slice(0, 7), ars: row.ars, usd: row.usd, exchange_rate_ars_per_usd: row.rate, rate_series: rate, aggregation, provider_rows: row.count, last_quote_date: row.quoteDate, calculation: salary ? `${salaryId}-v1` : 'porcel-v1', salary_source: regular ? 'Secretaría de Trabajo / OEDE / SIPA' : 'Secretaría de Trabajo / OEDE / SIPA · Datos Argentina', salary_license: regular ? 'https://www.argentina.gob.ar/terminos-y-condiciones' : 'CC BY 4.0', asado_kg: row.asadoKg, asado_price_ars_per_kg: row.asadoPrice, asado_index_2016_04_100: row.asadoIndex, asado_source: 'INDEC GBA', asado_license: 'CC BY-SA 4.0' })), ['month', 'ars', 'usd', 'exchange_rate_ars_per_usd', 'rate_series', 'aggregation', 'provider_rows', 'last_quote_date', 'calculation', ...(salary ? ['salary_source', 'salary_license'] : []), ...(showAsado ? ['asado_kg', 'asado_price_ars_per_kg', 'asado_index_2016_04_100', 'asado_source', 'asado_license'] : [])]), `${salary ? salaryId : 'porcel'}-${rate}-${aggregation}${showAsado ? '-asado' : ''}-${start}-${end}.csv`);

  return <>
    <section className="analysis-heading">
      <div><h1>{t.title}<span>{t.subtitle}</span></h1><p className="lead">{t.intro}</p></div>
      <div className="intro-aside"><span className="status-pill"><span />{t.reconstruction}</span><a href={salary ? (regular ? regularSalarySource : salarySource) : 'https://x.com/lapaulvolcker/status/1894067055923536110'} target="_blank" rel="noreferrer">{salary ? 'OEDE / SIPA' : '@lapaulvolcker'} <ArrowUpRight size={15} /></a></div>
    </section>
    <section className="chart-panel" aria-labelledby="chart-title">
      <div className="chart-heading"><div><h2 id="chart-title">{t.chartTitle}</h2><p>{t.base}</p><p className="mobile-reconstruction">{t.reconstruction}</p></div><button className="button secondary download" onClick={exportData} disabled={!validRange}><ArrowDownToLine size={16} />{t.download}</button></div>
      {salary && <div className="salary-basis"><label>{language === 'es' ? 'Serie salarial' : 'Salary series'}<select aria-label={language === 'es' ? 'Serie salarial' : 'Salary series'} value={basis} onChange={event => onBasisChange(event.target.value as SalaryBasis)}><option value="regular">{language === 'es' ? 'Normal y permanente (estimación oficial)' : 'Regular pay (official estimate)'}</option><option value="total">{language === 'es' ? 'Bruto con aguinaldo' : 'Gross pay including bonuses'}</option></select></label><p>{language === 'es' ? 'Al cambiar de serie, el período se ajusta a la cobertura compartida de las medidas visibles. «Todo» muestra la historia completa.' : 'Switching series resets the range to the shared coverage of visible measures. “All” shows the full history.'}</p></div>}
      <div className="controls">
        <label>{t.rate}<select aria-label={t.rate} value={rate} onChange={event => { setRate(event.target.value); setQuery('rate', event.target.value); }}>{Object.keys(names).map(id => <option key={id} value={id}>{rateName(id, language)}</option>)}</select></label>
        <label className="aggregation-control">{t.aggregation}<select aria-label={t.aggregation} value={aggregation} onChange={event => { setAggregation(event.target.value as Aggregation); setQuery('aggregation', event.target.value); }}><option value="close">{t.close}</option><option value="mean">{t.mean}</option></select></label>
        <div className="period-control"><span>{t.period}</span><div className="segmented">{[[null, t.all], [5, t.five], [3, t.three]].map(([years, label]) => <button key={String(years)} aria-pressed={end === max && start === (years ? `${Number(max.slice(0, 4)) - Number(years)}${max.slice(4)}` : min)} onClick={() => setRange(years as number | null)}>{label}</button>)}</div></div>
      </div>
      <div className="legend-and-range"><div className="legend"><span><i className="swatch ars" />{t.ars}</span><span><i className="swatch usd" />{t.usd} ({rateName(rate, language)})</span>{showAsado && <span><i className="swatch asado" />{t.asadoKg}</span>}</div><div className="dates"><label>{t.start}<input aria-label={t.start} type="month" value={start} min={min} max={max} onChange={event => { setStart(event.target.value); setQuery('from', event.target.value); }} /></label><label>{t.end}<input aria-label={t.end} type="month" value={end} min={min} max={max} onChange={event => { setEnd(event.target.value); setQuery('to', event.target.value); }} /></label></div></div>
      <label className="asado-toggle"><input type="checkbox" checked={showAsado} onChange={event => { setShowAsado(event.target.checked); setQuery('asado', event.target.checked ? '1' : '0'); }} /><span>{t.showAsado}</span><i className="swatch asado" /></label>
      {validRange ? <Suspense fallback={<LoadState error={false} language={language} />}><EconomicChart points={points} language={language} dark={dark} showAsado={showAsado} title={t.chartTitle} arsLabel={t.ars} /></Suspense> : <p className="range-error" role="alert">{t.rangeError}</p>}
      {showAsado && validRange && <p className="asado-description">{t.asadoSource}. {t.asadoNote} {points.every(row => row.asadoKg == null) ? <span className="asado-empty" role="status">{t.asadoEmpty}</span> : points.some(row => row.asadoKg == null) && t.asadoMissing}</p>}
      {current && validRange && <div className="month-inspector">
        <div className="inspector-date"><label htmlFor="month-inspector">{t.inspector}</label><strong>{month(current.date, language, true)}</strong><input id="month-inspector" aria-label={t.inspector} aria-valuetext={month(current.date, language, true)} type="range" min={0} max={points.length - 1} value={points.indexOf(current)} onChange={event => setSelected(points[Number(event.target.value)].date)} /></div>
        <div className="inspector-value"><span><i className="swatch ars" />{t.ars}</span><strong>ARS {number(current.ars, language)}</strong></div>
        <div className="inspector-value"><span><i className="swatch usd" />{t.usd}</span><strong>{current.usd == null ? number(null, language) : `USD ${number(current.usd, language)}`}</strong></div>
        <div className="inspector-rate"><span>{rateName(rate, language)} · ARS / USD</span><strong>{number(current.rate, language, 2)}</strong></div>
        {showAsado && <div className="asado-inspector" aria-label={t.asadoKg}>
          <div><span><i className="swatch asado" /> {t.asadoKg}</span><strong>{number(current.asadoKg, language, 1)}{current.asadoKg != null && ' kg'}</strong></div>
          <div><span>{t.asadoPrice} · ARS / kg</span><strong>{number(current.asadoPrice, language, 2)}</strong></div>
          <div><span>{t.asadoBase}</span><strong>{number(current.asadoIndex, language, 1)}</strong></div>
        </div>}
      </div>}
      <div className="chart-notes"><Info size={16} /><div><p>{t.note}</p><p>{aggregation === 'close' ? t.closeNote : t.averageNote}</p>{points.some(row => row.usd == null) && <p>{t.missing}</p>}</div></div>
      <details className="data-table-details"><summary>{t.table}<ChevronDown size={16} /></summary><div className="table-scroll" tabIndex={0} role="region" aria-label={t.table}><table>
        <caption>{t.tableCaption}{showAsado && ` ${t.asadoBase}. INDEC GBA · CC BY-SA 4.0.`}</caption>
        <thead><tr><th>{t.monthLabel}</th><th>ARS</th><th>USD</th>{showAsado && <><th>{t.asadoKg}</th><th>{t.asadoPrice} · ARS / kg</th><th>{t.asadoIndex}</th></>}<th>{t.quote}</th><th>{t.observations}</th><th>{t.quoteDate}</th></tr></thead>
        <tbody>{[...points].reverse().map(row => <tr key={row.date}><th scope="row">{month(row.date, language)}</th><td>{number(row.ars, language, 2)}</td><td>{number(row.usd, language, 2)}</td>{showAsado && <><td>{number(row.asadoKg, language, 1)}</td><td>{number(row.asadoPrice, language, 2)}</td><td>{number(row.asadoIndex, language, 1)}</td></>}<td>{number(row.rate, language, 2)}</td><td>{row.count || '-'}</td><td>{row.quoteDate ?? '-'}</td></tr>)}</tbody>
      </table></div></details>
    </section>
    <div className="snapshot-note"><span>{t.latest}: <strong>{month(source.at(-1)!.date, language)}</strong></span><span>{t.retrieved}: {inputs.generatedAt.slice(0, 10)}</span></div>
    <section className="reading-guide" aria-labelledby="reading-title"><h2 id="reading-title">{t.readTitle}</h2><div><h3><i className="swatch ars" />ARS</h3><p>{t.readArs}</p></div><div><h3><i className="swatch usd" />USD</h3><p>{t.readUsd}</p></div></section>
    {salary ? <SalaryMethodology language={language} regular={regular} /> : <Methodology language={language} />}
  </>;
}
