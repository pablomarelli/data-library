import { useRef, useState } from 'react';
import { ChevronDown, ChartNoAxesColumnIncreasing, Database } from 'lucide-react';
import { chartLink, chartSections } from '../navigation';
import type { Language } from '../data/model';
import { text } from '../i18n';

export default function Sidebar({ language, page }: { language: Language; page: string }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const label = language === 'es' ? 'Explorar gráficos' : 'Explore charts';
  const active = chartSections.flatMap(section => section.charts).find(chart => chart.page === page);
  return <aside className={`sidebar${open ? ' is-open' : ''}`} onKeyDown={event => {
    if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus(); }
  }}>
    <button className="sidebar-toggle" ref={toggle} aria-expanded={open} aria-controls="sidebar-navigation" onClick={() => setOpen(value => !value)}>
      <ChartNoAxesColumnIncreasing size={18} /><span>{label}<strong>{active?.title[language] ?? text[language].catalog}</strong></span><ChevronDown size={17} />
    </button>
    <nav id="sidebar-navigation" className="sidebar-navigation" aria-label={label} onClick={event => {
      if ((event.target as HTMLElement).closest('a')) setOpen(false);
    }}>
      {chartSections.map(section => <section className="sidebar-section" key={section.id} aria-labelledby={`nav-${section.id}`}>
        <h2 id={`nav-${section.id}`}>{section.title[language]}</h2>
        <ul>{section.charts.map(chart => <li key={chart.page}><a href={chartLink(chart.page, page)} aria-current={page === chart.page ? 'page' : undefined}><ChartNoAxesColumnIncreasing size={16} /><span>{chart.title[language]}</span></a></li>)}</ul>
      </section>)}
      <div className="sidebar-library"><a href="#data" aria-current={page === 'data' ? 'page' : undefined}><Database size={16} /><span>{text[language].catalog}</span></a></div>
    </nav>
  </aside>;
}
