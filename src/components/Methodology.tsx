import { ArrowUpRight } from 'lucide-react';
import { useEffect } from 'react';
import type { Language } from '../data/model';
import { text } from '../i18n';

export default function Methodology({ language }: { language: Language }) {
  const t = text[language];
  useEffect(() => {
    if (location.hash !== '#methodology') return;
    const frame = requestAnimationFrame(() => document.getElementById('methodology')?.scrollIntoView({ behavior: 'instant' }));
    return () => cancelAnimationFrame(frame);
  }, []);
  return <section className="methodology" id="methodology" aria-labelledby="method-title">
    <div className="section-intro"><h2 id="method-title">{t.methodTitle}</h2><p>{t.methodIntro}</p><a className="text-link" href="https://x.com/lapaulvolcker/status/1894067055923536110" target="_blank" rel="noreferrer">{t.original}<ArrowUpRight size={15} /></a></div>
    <div className="method-content">
      <div className="formula"><p>{t.formula}</p><p>{t.formulaUsd}</p></div>
      <h3>{t.splice}</h3><p>{t.spliceBody}</p><p>{t.reason}</p>
      <div className="source-links">
        <a href="https://datos.gob.ar/es/dataset/indice-de-precios-al-consumidor-de-la-provincia-de-san-luis-base-2003-100" target="_blank" rel="noreferrer">IPC San Luis <ArrowUpRight size={14} /></a>
        <a href="https://apis.datos.gob.ar/series/api/series/?ids=148.3_INIVELNAL_DICI_M_26,101.1_I2NG_2016_M_22&limit=1000" target="_blank" rel="noreferrer">INDEC / datos.gob.ar <ArrowUpRight size={14} /></a>
        <a href="https://argentinadatos.com/docs/operations/get-cotizaciones-dolares.html" target="_blank" rel="noreferrer">ArgentinaDatos <ArrowUpRight size={14} /></a>
        <a href="https://www.indec.gob.ar/ftp/cuadros/economia/metodologia_21_cuentas_nacionales.pdf" target="_blank" rel="noreferrer">INDEC: 2007-2015 <ArrowUpRight size={14} /></a>
      </div>
      <h3>{t.asadoMethod}</h3><p>{t.asadoMethodBody}</p>
      <div className="source-links"><a href="https://www.indec.gob.ar/ftp/cuadros/economia/sh_ipc_precios_promedio.xls">INDEC · GBA <ArrowUpRight size={14} /></a><a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0 <ArrowUpRight size={14} /></a><a href="/data/asado-price.csv" download>{t.asadoPrice} · CSV</a><a href="/data/asado-index.csv" download>{t.asadoIndex} · CSV</a></div>
      <h3>{t.limits}</h3><p>{t.limitsBody}</p><p>{t.no2012}</p>
      <a className="text-link" href="/data/provenance.json" download>{t.audit}<ArrowUpRight size={15} /></a>
    </div>
  </section>;
}
