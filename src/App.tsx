import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from 'react';
import { Moon, Sun, ArrowUpRight, ChartNoAxesColumnIncreasing } from 'lucide-react';
import { MotionConfig } from 'motion/react';
import type { Language } from './data/model';
import { text } from './i18n';
import Analysis from './components/Analysis';
import Sidebar from './components/Sidebar';

const Catalog = lazy(() => import('./components/Catalog'));
const Football = lazy(() => import('./components/Football'));
const currentPage = () => location.hash.startsWith('#football') ? 'football' : location.hash === '#data' ? 'data' : location.hash === '#salary' || location.hash === '#salary-methodology' ? 'salary' : 'analysis';
function preference(key: string, fallback: string) {
  try { return new URLSearchParams(location.search).get(key) ?? localStorage.getItem(`data-library-${key}`) ?? fallback; } catch { return fallback; }
}
class ErrorBoundary extends Component<{ children: ReactNode; language: Language }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="load-state" role="alert"><h1>{text[this.props.language].error}</h1><button className="button" onClick={() => location.reload()}>{text[this.props.language].retry}</button></div> : this.props.children; }
}
export default function App() {
  const [language, setLanguage] = useState<Language>(preference('lang', 'es') === 'en' ? 'en' : 'es');
  const [theme, setTheme] = useState(preference('theme', 'light') === 'dark' ? 'dark' : 'light');
  const [page, setPage] = useState(currentPage);
  const t = text[language];
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.theme = theme;
    document.title = `data-library · ${page === 'football' ? (language === 'es' ? 'Goles y asistencias' : 'Goals and assists') : page === 'data' ? t.catalog : page === 'salary' ? (language === 'es' ? 'Salario bruto promedio · SIPA' : 'Average gross pay · SIPA') : 'Salario Digno Porcel Jr.'}`;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#101a2c' : '#f5f7fa');
    try { localStorage.setItem('data-library-lang', language); localStorage.setItem('data-library-theme', theme); } catch { /* Private browsing may disable storage. */ }
    const url = new URL(location.href); url.searchParams.set('lang', language); url.searchParams.set('theme', theme); history.replaceState(null, '', url);
  }, [language, theme, page, t.catalog]);
  useEffect(() => {
    const update = () => {
      const nextPage = currentPage();
      setPage(nextPage);
      if (location.hash.endsWith('methodology')) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' }));
      else window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return <MotionConfig reducedMotion="user"><a className="skip-link" href="#main" onClick={event => {
    event.preventDefault();
    const main = document.getElementById('main');
    main?.focus({ preventScroll: true });
    main?.scrollIntoView({ behavior: 'instant' });
  }}>{t.skip}</a><div className="site-shell">
    <header className="site-header"><a className="brand" href="#analysis" aria-label="data-library"><ChartNoAxesColumnIncreasing size={23} strokeWidth={2.3} /><span>data<span className="brand-divider">/</span>library</span></a><span className="byline">Pablo Marelli</span><div className="preferences"><div className="language-switch" aria-label="Language / Idioma"><button onClick={() => setLanguage('es')} aria-pressed={language === 'es'} lang="es">ES</button><span>/</span><button onClick={() => setLanguage('en')} aria-pressed={language === 'en'} lang="en">EN</button></div><button className="theme-switch" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={theme === 'light' ? t.dark : t.light}>{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}<span>{theme === 'light' ? t.dark : t.light}</span></button></div></header>
    <div className="workspace-layout">
      <Sidebar language={language} page={page} />
      <div className="workspace-content">
        <div className="content-toolbar"><span>{page === 'data' ? t.catalog : t.analysis}</span><a href={page === 'football' ? '#football-methodology' : page === 'salary' ? '#salary-methodology' : '#methodology'}>{t.sources}<ArrowUpRight size={13} /></a></div>
        <main id="main" tabIndex={-1}><ErrorBoundary language={language}>{page === 'football' ? <Suspense fallback={<p role="status">{t.loading}</p>}><Football language={language} /></Suspense> : page !== 'data' ? <Analysis language={language} dark={theme === 'dark'} kind={page === 'salary' ? 'salary' : 'porcel'} /> : <Suspense fallback={<p role="status">{t.loading}</p>}><Catalog language={language} /></Suspense>}</ErrorBoundary></main>
      </div>
    </div>
    <footer><div><a className="footer-brand" href="#analysis">data/library</a><p>{t.footer}</p></div><div><p>{t.status}</p><span>{t.made}</span></div></footer>
  </div></MotionConfig>;
}
