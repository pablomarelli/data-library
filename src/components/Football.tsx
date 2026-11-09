import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine } from 'lucide-react';
import { scaleLinear } from 'd3-scale';
import type { Language } from '../data/model';
import { footballPlayers, footballRadius, footballLeagues, type FootballData } from '../data/football';
import { useData } from '../data/useData';
import { LoadState } from './Analysis';
import { csv } from '../data/calculations';

export default function Football({ language }: { language: Language }) {
  const state = useData<FootballData>('/data/football.json');
  return state.data ? <FootballContent data={state.data} language={language} /> : <LoadState language={language} error={state.error} retry={state.retry} />;
}

function FootballContent({ data, language }: { data: FootballData; language: Language }) {
  const es = language === 'es';
  useEffect(() => { if (location.hash === '#football-methodology') document.getElementById('football-methodology')?.scrollIntoView({ behavior: 'instant' }); }, []);
  const [league, setLeague] = useState('all');
  const [season, setSeason] = useState('all');
  const [minimum, setMinimum] = useState(9000);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('28003');
  const [hovered, setHovered] = useState<string | null>(null);
  const players = useMemo(() => footballPlayers(data.rows, league, season, minimum), [data.rows, league, season, minimum]);
  const seasons = useMemo(() => [...new Set(data.rows.map(row => row.season))].sort((a, b) => b - a), [data]);
  const matches = players.filter(row => row.name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().includes(search.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()));
  const matchIds = new Set(matches.map(row => row.id));
  const active = (hovered ? players.find(row => row.id === hovered) : matches.find(row => row.id === selected)) ?? matches[0];
  const maxMinutes = Math.max(1, ...players.map(row => row.minutes));
  const x = scaleLinear().domain([0, Math.max(.5, ...players.map(row => row.assists90)) * 1.15]).nice().range([62, 878]);
  const y = scaleLinear().domain([0, Math.max(1, ...players.map(row => row.goals90)) * 1.1]).nice().range([460, 38]);
  const format = (value: number, digits = 2) => new Intl.NumberFormat(es ? 'es-AR' : 'en-US', { maximumFractionDigits: digits }).format(value);
  const title = es ? 'Goleadores y creadores' : 'Scorers and creators';
  const labelBoxes: { x: number; y: number; width: number }[] = [];
  const labels = players.filter(row => row.id === active?.id || row.goals90 > .45 || row.assists90 > .25).slice(0, 80).flatMap(row => {
    const px = x(row.assists90), py = y(row.goals90) - footballRadius(row.minutes, maxMinutes) - 8;
    const width = row.name.length * 6.8;
    if (row.id !== active?.id && labelBoxes.some(box => Math.abs(box.y - py) < 18 && Math.abs(box.x - px) < (box.width + width) / 2 + 8)) return [];
    if (px - width / 2 < 55 || px + width / 2 > 900) return [];
    labelBoxes.push({ x: px, y: py, width });
    return [<text key={row.id} x={px} y={py} textAnchor="middle" className={row.id === active?.id ? 'football-label selected' : 'football-label'}>{row.name}</text>];
  });
  const download = () => {
    const content = csv(players, ['id', 'name', 'goals', 'assists', 'minutes', 'appearances', 'goals90', 'assists90', 'first', 'last']);
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `football-${league}-${season}-${minimum}min.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <>
    <section className="analysis-heading"><div><h1>{title}<span>{es ? 'Dos formas de cambiar un partido.' : 'Two ways to change a game.'}</span></h1><p className="lead">{es ? 'Goles y asistencias cada 90 minutos en cinco ligas europeas. Cada burbuja es un jugador; su área representa los minutos registrados.' : 'Goals and assists per 90 minutes across five European leagues. Each bubble is a player; its area represents recorded minutes.'}</p></div></section>
    <section className="chart-panel football-panel" aria-labelledby="football-title">
      <div className="chart-heading"><div><h2 id="football-title">{es ? 'Finalización × creación' : 'Finishing × creation'}</h2><p>{data.first} → {data.last} · {es ? 'Cobertura observada, no carreras completas' : 'Observed coverage, not full careers'}</p></div><button className="button secondary download" disabled={!players.length} onClick={download}><ArrowDownToLine size={16} />CSV</button></div>
      <div className="controls football-controls">
        <label>{es ? 'Liga' : 'League'}<select aria-label={es ? 'Liga' : 'League'} value={league} onChange={e => { setLeague(e.target.value); setHovered(null); }}><option value="all">{es ? 'Las cinco ligas' : 'All five leagues'}</option>{Object.entries(footballLeagues).map(([id, name]) => <option key={id} value={id}>{name[language]}</option>)}</select></label>
        <label>{es ? 'Temporada' : 'Season'}<select aria-label={es ? 'Temporada' : 'Season'} value={season} onChange={e => { setSeason(e.target.value); setMinimum(e.target.value === 'all' ? 9000 : 900); setHovered(null); }}><option value="all">{es ? 'Todo el período' : 'All recorded seasons'}</option>{seasons.map(value => <option key={value} value={value}>{value}/{String(value + 1).slice(2)}</option>)}</select></label>
        <label>{es ? 'Minutos mínimos' : 'Minimum minutes'}<select aria-label={es ? 'Minutos mínimos' : 'Minimum minutes'} value={minimum} onChange={e => { setMinimum(Number(e.target.value)); setHovered(null); }}>{[900, 2700, 9000, 18000].map(value => <option key={value} value={value}>{format(value, 0)}</option>)}</select></label>
      </div>
      <div className="football-search"><label>{es ? 'Buscar jugador' : 'Search players'}<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={es ? 'Nombre del jugador' : 'Player name'} /></label><label>{es ? 'Inspeccionar jugador' : 'Inspect player'}<select aria-label={es ? 'Inspeccionar jugador' : 'Inspect player'} value={active?.id ?? ''} onChange={e => { setSelected(e.target.value); setHovered(null); }}>{!matches.length && <option value="">{es ? 'Sin coincidencias' : 'No matches'}</option>}{matches.map(row => <option value={row.id} key={row.id}>{row.name}</option>)}</select></label></div>
      <p className="football-caption" role="status">{format(players.length, 0)} {es ? 'jugadores' : 'players'} · {es ? 'Área de burbuja = minutos. Goles con penales.' : 'Bubble area = minutes. Goals include penalties.'}{search && ` · ${matches.length} ${es ? 'coincidencias' : 'matches'}`}</p>
      {players.length ? <div className="football-plot" tabIndex={0} role="region" aria-label={es ? 'Gráfico de goles y asistencias' : 'Goals and assists chart'}><svg viewBox="0 0 940 520" role="img" aria-labelledby="football-svg-title football-svg-desc" onPointerLeave={() => setHovered(null)}>
        <title id="football-svg-title">{title}</title><desc id="football-svg-desc">{es ? 'Eje horizontal: asistencias cada 90 minutos. Eje vertical: goles cada 90 minutos. Los mismos datos están disponibles en la tabla.' : 'Horizontal axis: assists per 90 minutes. Vertical axis: goals per 90 minutes. The same data is available in the table.'}</desc>
        {x.ticks(6).map(value => <g key={`x${value}`}><line x1={x(value)} x2={x(value)} y1={38} y2={460} className="football-grid" /><text x={x(value)} y={484} textAnchor="middle" className="football-tick">{format(value)}</text></g>)}
        {y.ticks(5).map(value => <g key={`y${value}`}><line x1={62} x2={878} y1={y(value)} y2={y(value)} className="football-grid" /><text x={48} y={y(value) + 4} textAnchor="end" className="football-tick">{format(value)}</text></g>)}
        <text x={62} y={20} className="football-axis">{es ? 'Goles / 90 min' : 'Goals / 90 min'}</text><text x={878} y={513} textAnchor="end" className="football-axis">{es ? 'Asistencias / 90 min' : 'Assists / 90 min'}</text>
        {[...players].sort((a, b) => b.minutes - a.minutes).map(row => <circle key={row.id} data-player={row.id} cx={x(row.assists90)} cy={y(row.goals90)} r={footballRadius(row.minutes, maxMinutes)} className={`football-bubble${row.id === active?.id ? ' selected' : ''}${search && !matchIds.has(row.id) ? ' dimmed' : ''}`} onPointerEnter={() => setHovered(row.id)} onClick={() => { setSelected(row.id); setSearch(''); }}><title>{row.name}: {format(row.goals90)} G/90, {format(row.assists90)} A/90 · {format(row.minutes, 0)} min</title></circle>)}
        <g pointerEvents="none">{labels}</g>
      </svg></div> : <p className="load-state">{es ? 'No hay jugadores con estos filtros. Reducí los minutos mínimos.' : 'No players meet these filters. Reduce the minimum minutes.'}</p>}
      {active && <div className="football-inspector" aria-live="polite"><strong>{active.name}</strong><dl>{[[es ? 'Goles / 90' : 'Goals / 90', format(active.goals90)], [es ? 'Asistencias / 90' : 'Assists / 90', format(active.assists90)], [es ? 'Goles' : 'Goals', format(active.goals, 0)], [es ? 'Asistencias' : 'Assists', format(active.assists, 0)], [es ? 'Minutos' : 'Minutes', format(active.minutes, 0)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p>{es ? 'Apariciones registradas' : 'Recorded appearances'}: {active.first} → {active.last}</p></div>}
      <details className="football-table"><summary>{es ? 'Ver datos' : 'View data'}</summary><div className="table-scroll" tabIndex={0} role="region" aria-label={es ? 'Estadísticas de jugadores' : 'Player statistics'}><table><caption>{es ? 'Jugadores según los filtros actuales' : 'Players matching the current filters'}</caption><thead><tr>{[es ? 'Jugador' : 'Player', 'G / 90', 'A / 90', es ? 'Minutos' : 'Minutes'].map(value => <th key={value} scope="col">{value}</th>)}</tr></thead><tbody>{matches.map(row => <tr key={row.id}><th scope="row">{row.name}</th><td>{format(row.goals90)}</td><td>{format(row.assists90)}</td><td>{format(row.minutes, 0)}</td></tr>)}</tbody></table></div></details>
    </section>
    <section id="football-methodology" className="football-methodology"><h2>{es ? 'Qué compara este gráfico' : 'What this chart compares'}</h2><p>{es ? 'Solo apariciones registradas en Premier League, La Liga, Serie A, Bundesliga y Ligue 1. No incluye copas, selecciones, MLS ni Arabia Saudita. El período disponible empieza en 2012: no son carreras completas y no mide el impacto total del jugador.' : 'Recorded appearances in the Premier League, La Liga, Serie A, Bundesliga, and Ligue 1 only. Cups, national teams, MLS, and Saudi Arabia are excluded. Available coverage starts in 2012: these are not full careers or a measure of total player impact.'}</p><p>{es ? 'Cada tasa es el total de goles o asistencias dividido por los mismos minutos y multiplicado por 90. Incluye penales. La temporada agrupa fechas de julio a junio. La cobertura puede ser incompleta; no rellenamos partidos faltantes. El umbral predeterminado es 9.000 minutos para todo el período y 900 para una temporada.' : 'Each rate is total goals or assists divided by the same recorded minutes, multiplied by 90. Penalties are included. Seasons group July through June dates. Coverage can be incomplete; missing matches are not estimated. The default threshold is 9,000 minutes for the full period and 900 for one season.'}</p><p>{es ? 'Fuente: colección de David Cariboo basada en Transfermarkt. El editor declara CC0; esto no garantiza derechos sobre todos los datos originales. Se conserva la atribución. La fecha de publicación no implica cobertura hasta esa fecha.' : 'Source: David Cariboo’s Transfermarkt-derived collection. The publisher declares CC0; this does not guarantee rights to all upstream data. Attribution is retained. Publication dates do not establish match coverage.'}</p><div className="source-links"><a href="https://github.com/dcaribou/transfermarkt-datasets" target="_blank" rel="noreferrer">{es ? 'Fuente y condiciones' : 'Source and terms'}</a><a href="/data/football.csv" download>CSV · {es ? 'por jugador, liga y temporada' : 'by player, league, and season'}</a><a href="/data/football.json" download>JSON · {es ? 'datos y procedencia' : 'data and provenance'}</a></div><p className="football-hash">SHA-256: {data.sha256}</p></section>
  </>;
}
