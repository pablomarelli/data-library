import { useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { Language } from '../data/model';
import { regularSalarySource, salarySource } from '../analysisCopy';
import { text } from '../i18n';

export default function SalaryMethodology({ language, regular }: { language: Language; regular: boolean }) {
  const es = language === 'es';
  const t = text[language];
  useEffect(() => {
    if (location.hash !== '#salary-methodology') return;
    const frame = requestAnimationFrame(() => document.getElementById('salary-methodology')?.scrollIntoView({ behavior: 'instant' }));
    return () => cancelAnimationFrame(frame);
  }, []);
  return <section className="methodology" id="salary-methodology" aria-labelledby="salary-method-title">
    <div className="section-intro"><h2 id="salary-method-title">{es ? 'Qué salario estamos midiendo' : 'Which salary we measure'}</h2><p>{es ? 'Fuente: Secretaría de Trabajo / OEDE, en base al SIPA. La serie por todo concepto se distribuye por SSPM, Datos Argentina; la estimación normal y permanente proviene del libro oficial de OEDE.' : 'Source: Secretaría de Trabajo / OEDE, based on SIPA. The all-concepts series is distributed by SSPM, Datos Argentina; the regular-pay estimate comes from the official OEDE workbook.'}</p><a className="text-link" href={regular ? regularSalarySource : salarySource} target="_blank" rel="noreferrer">{t.sourceLink}<ArrowUpRight size={15} /></a></div>
    <div className="method-content">
      <div className="formula"><p>{es ? 'Salario USD = salario bruto ARS / cotización ARS por USD' : 'Salary USD = gross salary ARS / exchange rate ARS per USD'}</p><p>{es ? 'Kilos equivalentes = salario bruto ARS / precio del asado ARS por kg' : 'Equivalent kilograms = gross salary ARS / asado price ARS per kg'}</p></div>
      <h3>{es ? 'Promedio bruto, no salario de bolsillo' : 'Gross average, not take-home pay'}</h3>
      <p>{es ? 'Usamos la media aritmética por relación laboral del empleo asalariado privado registrado en todo el país. Una persona con varios empleos puede aparecer más de una vez. No es la mediana y no incluye empleo público, informal ni trabajo independiente.' : 'We use the arithmetic mean per employment relationship for registered private-sector jobs nationwide. A person with several jobs can appear more than once. This is not the median and excludes public-sector, informal, and self-employed work.'}</p>
      <p>{es ? 'Ambas opciones son brutas antes de los aportes del empleado. La serie por todo concepto, sin indemnizaciones, incluye aguinaldo y otros pagos periódicos. Conserva los picos de junio y diciembre.' : 'Both options are gross before employee contributions. The all-concepts series, excluding dismissal compensation, includes the semiannual bonus and other periodic payments. It retains June and December peaks.'}</p>
      <h3>{es ? 'Normal y permanente: estimación oficial' : 'Regular pay: an official estimate'}</h3>
      <p>{es ? 'La opción predeterminada usa la columna «Serie Desestacionalizada» de remuneración normal y permanente del cuadro C 1 de OEDE. El organismo aplica un ajuste estacional X-12 ARIMA y un factor de nivel basado en agosto para excluir la influencia del aguinaldo y otros conceptos estacionales. No es la columna tendencia-ciclo. No dividimos salarios por 13 ni aplicamos suavizado propio.' : 'The default uses the seasonally adjusted normal and permanent remuneration column from OEDE table C 1. The agency applies X-12 ARIMA seasonal adjustment and an August-based level factor to remove the influence of the semiannual bonus and other seasonal payments. This is not the trend-cycle column. We do not divide pay by 13 or apply our own smoothing.'}</p>
      <p>{es ? 'Las dos descargas son publicaciones de distinta fecha. Pueden tener valores revisados y fechas finales diferentes. No las empalmamos ni extendemos la estimación con datos de la serie por todo concepto.' : 'The two downloads are different publication vintages. They can contain revised values and different end dates. We do not splice them or extend the estimate using all-concepts observations.'}</p>
      <h3>{es ? 'Cobertura y revisiones' : 'Coverage and revisions'}</h3>
      <p>{es ? 'La historia salarial comienza en enero de 1995. Los últimos dos años son provisorios y pueden revisarse. Guardamos una copia de cada descarga. Usamos los niveles originales en pesos corrientes, sin ajuste por IPC. El análisis termina donde termina la serie salarial; cada conversión requiere un dato del mismo mes. No completamos cotizaciones ni precios faltantes.' : 'Salary history starts in January 1995. The latest two years are provisional and can be revised. Each download is archived. We use original current-peso levels without CPI adjustment. The analysis ends with the salary series; each conversion requires a same-month observation. Missing exchange rates and prices are not filled.'}</p>
      <p>{es ? 'El salario tiene cobertura nacional; el precio del corte asado corresponde a Gran Buenos Aires y comienza en abril de 2016. Los kilos expresan un equivalente del salario bruto, no una cantidad que el trabajador pueda comprar después de descuentos y otros gastos.' : 'Salary coverage is national; the asado cut price covers Greater Buenos Aires and starts in April 2016. Kilograms express a gross-pay equivalent, not an amount a worker can buy after deductions and other expenses.'}</p>
      <div className="source-links"><a href={regularSalarySource} target="_blank" rel="noreferrer">OEDE · {t.methodology}<ArrowUpRight size={14} /></a><a href={regular ? 'https://www.argentina.gob.ar/terminos-y-condiciones' : 'https://creativecommons.org/licenses/by/4.0/'} target="_blank" rel="noreferrer">{regular ? (es ? 'Condiciones de uso' : 'Usage terms') : 'CC BY 4.0'}</a><a href={`/data/salary-private-${regular ? 'regular' : 'gross'}.csv`} download>CSV · SIPA</a><a href="https://www.indec.gob.ar/ftp/cuadros/economia/sh_ipc_precios_promedio.xls">INDEC · Asado</a><a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">Asado · CC BY-SA 4.0</a></div>
      <a className="text-link" href="/data/provenance.json" download>{t.audit}<ArrowUpRight size={15} /></a>
    </div>
  </section>;
}
