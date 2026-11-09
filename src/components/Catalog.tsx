import { useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, ChevronDown, Search } from 'lucide-react';
import type { Catalog as CatalogData, CatalogEntry, Language, Series } from '../data/model';
import { month, number, text } from '../i18n';
import { useData } from '../data/useData';
import { LoadState } from './Analysis';

function SeriesPreview({ entry, language }: { entry: CatalogEntry; language: Language }) {
  const { data, error, retry } = useData<Series>(entry.json);
  const t = text[language];
  if (!data) return <LoadState error={error} retry={retry} language={language} />;
  return <div className="table-scroll" tabIndex={0} role="region" aria-label={t.raw}><table><caption>{t.raw} · {entry.unit} · {language === 'es' ? 'Últimas 12 observaciones' : 'Latest 12 observations'}</caption><thead><tr><th>{t.monthLabel}</th><th>{entry.unit}</th>{entry.frequency === 'daily' && <th>{language === 'es' ? 'Compra' : 'Buy'}</th>}</tr></thead><tbody>{data.observations.slice(-12).reverse().map(row => <tr key={row.date}><th scope="row">{row.date}</th><td>{number(row.value, language, 4)}</td>{entry.frequency === 'daily' && <td>{number(row.buy, language, 4)}</td>}</tr>)}</tbody></table></div>;
}

export default function Catalog({ language }: { language: Language }) {
  const { data, error, retry } = useData<CatalogData>('/data/catalog.json');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const t = text[language];
  if (!data) return <LoadState error={error} retry={retry} language={language} />;
  const entries = data.entries.filter(entry => (filter === 'all' || entry.id.startsWith(filter)) && `${entry.name.es} ${entry.name.en} ${entry.description.es} ${entry.description.en} ${entry.provider}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
  return <>
    <section className="catalog-heading"><h1>{t.reproducible}</h1><p className="lead">{t.catalogIntro}</p><div className="catalog-meta"><strong>{data.entries.length} {t.library.toLowerCase()}</strong><span>{t.retrieved}: {data.generatedAt.slice(0, 10)}</span></div></section>
    <div className="catalog-controls"><label className="search-field"><Search size={18} /><span className="sr-only">{t.search}</span><input type="search" placeholder={t.searchPlaceholder} value={search} onChange={event => setSearch(event.target.value)} /></label><div className="segmented" aria-label={t.catalog}>{[['all', t.allData], ['usd-', t.rates], ['cpi-', t.inflation], ['asado-', t.food], ['salary-', t.salaries]].map(([key, label]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}</div></div>
    <div className="dataset-list">
      <div className="dataset-columns" aria-hidden="true"><span>{t.dataset}</span><span>{t.coverage}</span><span>{t.frequency}</span><span>{t.observations}</span><span /></div>
      {entries.map(entry => <article className={`dataset ${expanded === entry.id ? 'expanded' : ''}`} key={entry.id}>
        <button className="dataset-row" aria-expanded={expanded === entry.id} aria-controls={`details-${entry.id}`} onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}>
          <span className="dataset-name"><strong>{entry.name[language]}</strong><span>{entry.provider} · {entry.unit}</span></span>
          <span className="dataset-coverage">{month(entry.start, language)}<span> - {month(entry.end, language)}</span></span>
          <span className="frequency">{entry.frequency === 'daily' ? t.daily : t.monthly}</span><span className="observation-count">{number(entry.count, language)}</span><ChevronDown size={17} />
        </button>
        {expanded === entry.id && <div className="dataset-details" id={`details-${entry.id}`}><div className="dataset-description"><h3>{t.seriesDetails}</h3><p>{entry.description[language]}</p><p>{entry.notes[language]}</p><h4>{t.license}</h4><p>{entry.license[language]} <a href={entry.licenseUrl} target="_blank" rel="noreferrer">{language === 'es' ? 'Condiciones' : 'Terms'}<ArrowUpRight size={13} /></a></p><div className="dataset-actions"><a className="button" href={entry.csv} download><ArrowDownToLine size={15} />CSV</a><a className="button secondary" href={entry.json} download>JSON</a><a className="text-link" href={entry.sourceUrl} target={entry.sourceUrl.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{t.sourceLink}<ArrowUpRight size={15} /></a></div></div><SeriesPreview entry={entry} language={language} /></div>}
      </article>)}
      {!entries.length && <div className="load-state"><p>{t.noResults}</p><button className="button secondary" onClick={() => { setSearch(''); setFilter('all'); }}>{t.reset}</button></div>}
    </div>
    <aside className="coverage-note"><h2>{t.coverageTitle}</h2><p>{t.coverageBody}</p><a className="text-link" href="https://fred.stlouisfed.org/series/ARGCCUSMA02STM" target="_blank" rel="noreferrer">OECD / FRED<ArrowUpRight size={15} /></a></aside>
  </>;
}
