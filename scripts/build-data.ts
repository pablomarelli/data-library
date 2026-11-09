import { readFile, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import type { SnapshotManifest } from './sources';
import type { Catalog, ChartInputs, Observation, Series } from '../src/data/model';
import { csv, linkCpi, monthlyRates, priceIndex, validateObservations } from '../src/data/calculations';
import { parseAsadoWorkbook } from './parse-asado';
import { parseSalaryCsv, parseRegularSalary } from './parse-salary';

const manifest: SnapshotManifest = JSON.parse(await readFile('data/snapshot.json', 'utf8'));
const raw: Record<string, string> = {};
let asado: Observation[] = [];
let salaryRegular: Observation[] = [];
for (const [key, source] of Object.entries(manifest.sources)) {
  const content = await readFile(source.file);
  if (createHash('sha256').update(content).digest('hex') !== source.sha256) throw new Error(`Source integrity failure: ${key}`);
  if (key === 'asado') asado = parseAsadoWorkbook(content);
  else if (key === 'salaryRegular') salaryRegular = parseRegularSalary(content);
  else raw[key] = content.toString('utf8');
}
const parseCsv = (text: string): Observation[] => text.trim().split(/\r?\n/).slice(1).filter(Boolean).flatMap(line => {
  const [date, value] = line.split(',');
  return value === '' || value === '.' ? [] : [{ date, value: Number(value) }];
});
const sanLuis = validateObservations(parseCsv(raw.sanLuis), 'san-luis');
const indec = JSON.parse(raw.indec) as { data: [string, number | null, number | null][] };
const national = validateObservations(indec.data.flatMap(([date, value]) => value == null ? [] : [{ date, value }]), 'national');
const gba = validateObservations(indec.data.flatMap(([date, , value]) => value == null ? [] : [{ date, value }]), 'gba');
const reference = validateObservations(parseCsv(raw.reference).filter(row => row.date >= '1989-01-01'), 'reference');
const linked = linkCpi(sanLuis, gba, national);
const salary = parseSalaryCsv(raw.salary);
const series: Series[] = [];
const cpiLicense = { es: 'Fuente pública. Consultar condiciones del organismo; atribución conservada.', en: 'Public source. Check agency reuse terms; attribution retained.' };
const add = (item: Series) => { item.observations = validateObservations(item.observations, item.id); series.push(item); };
for (const [id, es, en, rows, url, unit] of [
  ['cpi-san-luis', 'IPC San Luis', 'San Luis CPI', sanLuis, manifest.sources.sanLuis.url, '2003 = 100'],
  ['cpi-gba', 'IPC Gran Buenos Aires', 'Greater Buenos Aires CPI', gba, manifest.sources.indec.url, '2016-12 = 100'],
  ['cpi-national', 'IPC nacional', 'National CPI', national, manifest.sources.indec.url, '2016-12 = 100'],
] as const) add({ id, name: { es, en }, description: { es: 'Índice de precios al consumidor, nivel general.', en: 'Consumer price index, all items.' }, unit, frequency: 'monthly', provider: id === 'cpi-san-luis' ? 'San Luis · datos.gob.ar' : 'INDEC · datos.gob.ar', sourceUrl: url, licenseUrl: 'https://datos.gob.ar/', license: cpiLicense, notes: { es: 'Niveles originales. Los índices regionales no representan la misma canasta.', en: 'Original index levels. Regional indices do not represent the same basket.' }, observations: rows });
add({ id: 'cpi-linked', name: { es: 'IPC enlazado desde 2012', en: 'Linked CPI since 2012' }, description: { es: 'San Luis → GBA → nacional. Serie de elaboración propia.', en: 'San Luis → GBA → national. Independently calculated series.' }, unit: '2012-10 = 100', frequency: 'monthly', provider: 'data-library', sourceUrl: '#methodology', licenseUrl: 'https://datos.gob.ar/', license: cpiLicense, notes: { es: 'San Luis hasta abril 2016; GBA mayo 2016-junio 2017; nacional desde julio 2017. Enlace por cocientes de índices, sin redondeo intermedio.', en: 'San Luis through April 2016; GBA May 2016-June 2017; national from July 2017. Linked index ratios, without intermediate rounding.' }, observations: linked });
add({ id: 'usd-reference', name: { es: 'Dólar de referencia histórico', en: 'Historical reference dollar' }, description: { es: 'Promedio mensual de cotizaciones diarias. Historia desde 1989.', en: 'Monthly average of daily rates. History from 1989.' }, unit: 'ARS / USD', frequency: 'monthly', provider: 'OECD · FRED', sourceUrl: 'https://fred.stlouisfed.org/series/ARGCCUSMA02STM', licenseUrl: 'https://www.oecd.org/en/about/terms-conditions.html', license: { es: 'Datos OECD redistribuidos por FRED. Consultar términos OECD.', en: 'OECD data distributed by FRED. See OECD terms.' }, notes: { es: 'La fuente expresa la historia en pesos actuales como unidad monetaria, no pesos de poder adquisitivo constante. Antes de 1992 ya incorpora la conversión de australes; no dividir nuevamente por 10.000. No equivale a una pizarra minorista.', en: 'The source expresses history in current peso currency units, not constant purchasing power. Pre-1992 values already account for austral conversion; do not divide by 10,000 again. Not a retail bank quote.' }, observations: reference });
const rateNames: Record<string, [string, string]> = { oficial: ['Dólar oficial', 'Official dollar'], blue: ['Dólar blue', 'Parallel dollar (blue)'], bolsa: ['Dólar MEP', 'MEP dollar'], contadoconliqui: ['Dólar CCL', 'CCL dollar'], mayorista: ['Dólar mayorista', 'Wholesale dollar'], tarjeta: ['Dólar tarjeta', 'Card dollar'], cripto: ['Dólar cripto', 'Crypto dollar'] };
type RateRow = { fecha: string; casa: string; venta: number | null; compra: number | null };
const rates = JSON.parse(raw.rates) as RateRow[];
if (!Array.isArray(rates)) throw new Error('Invalid exchange-rate payload');
for (const [casa, [es, en]] of Object.entries(rateNames)) {
  const observations = rates.filter(row => row.casa === casa && row.venta != null).map(row => ({ date: row.fecha, value: row.venta!, buy: row.compra }));
  if (!observations.length) throw new Error(`Missing rate: ${casa}`);
  add({ id: `usd-${casa}`, name: { es, en }, description: { es: 'Cotizaciones publicadas por el proveedor. Valor principal: venta.', en: 'Provider-published quotes. Primary value: sell price.' }, unit: 'ARS / USD', frequency: 'daily', provider: 'ArgentinaDatos', sourceUrl: `https://api.argentinadatos.com/v1/cotizaciones/dolares/${casa}`, licenseUrl: 'https://argentinadatos.com/docs/uso', license: { es: 'Reutilización con atribución según el proveedor; derechos de fuentes originales vigentes.', en: 'Reuse with attribution under provider terms; upstream rights still apply.' }, notes: { es: 'Puede repetir cotizaciones en fines de semana y feriados. Una fila no prueba que hubo operaciones ese día. No se verificó la composición histórica de instrumentos.', en: 'May repeat quotes on weekends and holidays. A row does not prove trading occurred that day. Historical instrument composition is not verified.' }, observations });
}
const asadoMetadata = {
  frequency: 'monthly' as const,
  sourceUrl: manifest.sources.asado.url,
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  license: { es: 'CC BY-SA 4.0. Fuente: INDEC. Normalización e índice: data-library.', en: 'CC BY-SA 4.0. Source: INDEC. Normalization and index: data-library.' },
  notes: { es: 'Precio promedio del corte asado crudo en Gran Buenos Aires (CABA y 24 partidos). No representa una parrillada completa ni un promedio nacional. Sin estimaciones anteriores a abril de 2016.', en: 'Average raw asado cut price in Greater Buenos Aires (Buenos Aires City and 24 districts). Not a complete barbecue meal or a national average. No estimates before April 2016.' },
};
add({ ...asadoMetadata, id: 'asado-price', provider: 'INDEC · GBA', unit: 'ARS / kg', name: { es: 'Precio del asado · GBA', en: 'Asado price · GBA' }, description: { es: 'Precio promedio mensual por kilogramo, en pesos corrientes.', en: 'Monthly average price per kilogram, in current pesos.' }, observations: asado });
add({ ...asadoMetadata, id: 'asado-index', provider: 'data-library · INDEC', unit: '2016-04 = 100', name: { es: 'Índice del precio del asado', en: 'Asado price index' }, description: { es: 'Índice nominal calculado como 100 × precio del mes / precio de abril de 2016. Elaboración propia; no es un índice oficial del INDEC.', en: 'Nominal index calculated as 100 × monthly price / April 2016 price. Independently calculated; not an official INDEC index.' }, observations: priceIndex(asado) });
add({ id: 'salary-private-gross', name: { es: 'Salario bruto promedio privado registrado', en: 'Registered private-sector average gross pay' }, description: { es: 'Promedio mensual por relación laboral, en pesos corrientes. Incluye aguinaldo y otros pagos periódicos; no es salario de bolsillo.', en: 'Monthly mean per employment relationship, in current pesos. Includes the semiannual bonus and other periodic payments; not take-home pay.' }, unit: 'ARS / month', frequency: 'monthly', provider: 'Secretaría de Trabajo · OEDE / SIPA · datos.gob.ar', sourceUrl: manifest.sources.salary.url, licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', license: { es: 'CC BY 4.0. Fuente: Secretaría de Trabajo / OEDE, en base al SIPA. Distribución: SSPM, Datos Argentina. Normalización: data-library.', en: 'CC BY 4.0. Source: Secretaría de Trabajo / OEDE, based on SIPA. Distribution: SSPM, Datos Argentina. Normalization: data-library.' }, notes: { es: 'Argentina. Empleo asalariado privado registrado; excluye empleo público, informal y trabajo independiente. Media aritmética por relación laboral, no mediana ni promedio por persona. Bruto antes de aportes del empleado, por todo concepto, sin indemnizaciones. Los picos de junio y diciembre incluyen aguinaldo. Los últimos dos años son provisorios y pueden revisarse.', en: 'Argentina. Registered private-sector employment; excludes public-sector, informal, and self-employed work. Arithmetic mean per job, not median or per-person average. Gross before employee contributions, all payment concepts excluding dismissal compensation. June and December peaks include the semiannual bonus. The latest two years are provisional and subject to revision.' }, observations: salary });
add({ id: 'salary-private-regular', name: { es: 'Salario normal y permanente privado registrado', en: 'Registered private-sector regular pay estimate' }, description: { es: 'Remuneración bruta promedio normal y permanente, desestacionalizada, en pesos corrientes. Estimación oficial que excluye la influencia del aguinaldo y otros conceptos estacionales.', en: 'Seasonally adjusted average normal and permanent gross remuneration, in current pesos. Official estimate excluding the influence of the semiannual bonus and other seasonal payments.' }, unit: 'ARS / month', frequency: 'monthly', provider: 'Secretaría de Trabajo · OEDE / SIPA', sourceUrl: manifest.sources.salaryRegular.url, licenseUrl: 'https://www.argentina.gob.ar/terminos-y-condiciones', license: { es: 'Fuente pública: Secretaría de Trabajo / OEDE, en base al SIPA. Consultar términos del sitio. La licencia del CSV de Datos Argentina no se presume aplicable a este libro. Extracción: data-library.', en: 'Public source: Secretaría de Trabajo / OEDE, based on SIPA. See website terms. The Datos Argentina CSV license is not assumed to apply to this workbook. Extraction: data-library.' }, notes: { es: 'Promedio bruto por relación laboral privada registrada, no salario de bolsillo ni promedio de todos los trabajadores. Serie desestacionalizada por el organismo, distinta de la tendencia-ciclo. No aplicamos suavizado adicional ni ajuste por IPC. Puede revisarse. Este libro y el CSV por todo concepto son publicaciones de distinta fecha: no se empalman y sus coberturas pueden diferir.', en: 'Gross mean per registered private-sector job, not take-home pay or an all-workers average. Agency seasonally adjusted series, distinct from the trend-cycle series. No additional smoothing or CPI adjustment is applied. Subject to revision. This workbook and the all-concepts CSV are different publication vintages: they are not spliced and coverage may differ.' }, observations: salaryRegular });
const inputs: ChartInputs = { generatedAt: manifest.retrievedAt, cpi: linked, asado, salary, salaryRegular, rates: {} };
for (const item of series.filter(item => item.id.startsWith('usd-') && item.frequency === 'daily')) inputs.rates[item.id] = monthlyRates(item.observations, manifest.retrievedAt);
const catalog: Catalog = { generatedAt: manifest.retrievedAt, calculationVersion: 'porcel-v1', entries: series.map(({ observations, ...metadata }) => ({ ...metadata, start: observations[0].date, end: observations.at(-1)!.date, count: observations.length, csv: `/data/${metadata.id}.csv`, json: `/data/${metadata.id}.json` })) };
// Validate everything before replacing the published directory. Source snapshots remain immutable.
const staging = 'public/data.next';
await mkdir(staging, { recursive: true });
for (const item of series) {
  await writeFile(`${staging}/${item.id}.json`, JSON.stringify(item));
  await writeFile(`${staging}/${item.id}.csv`, csv(item.observations, ['date', 'value', ...(item.frequency === 'daily' ? ['buy'] : [])]));
}
await writeFile(`${staging}/catalog.json`, JSON.stringify(catalog, null, 2));
await writeFile(`${staging}/chart-inputs.json`, JSON.stringify(inputs));
await writeFile(`${staging}/provenance.json`, JSON.stringify(manifest, null, 2));
await rm('public/data.previous', { recursive: true, force: true });
try { await rename('public/data', 'public/data.previous'); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
await rename(staging, 'public/data');
await rm('public/data.previous', { recursive: true, force: true });
console.log(catalog.entries.map(item => `${item.id}: ${item.count} observations, ${item.start} → ${item.end}`).join('\n'));
