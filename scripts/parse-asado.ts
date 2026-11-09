import { read, utils } from '@e965/xlsx';
import { validateObservations } from '../src/data/calculations';
import type { Observation } from '../src/data/model';

const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const label = (cell: unknown) => String(cell ?? '').trim().toLowerCase();

/** INDEC GBA workbook: merged year headers and optional separator columns. */
export function parseAsadoWorkbook(content: Uint8Array): Observation[] {
  const sheet = read(content, { type: 'buffer' }).Sheets.GBA;
  if (!sheet) throw new Error('Asado: missing GBA sheet');
  return parseAsadoRows(utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null }));
}

export function parseAsadoRows(rows: unknown[][]): Observation[] {
  const header = rows.findIndex(row => label(row[0]) === 'variedad');
  const products = rows.filter(row => label(row[0]) === 'asado');
  if (header < 0 || products.length !== 1 || label(products[0][1]) !== 'kg') throw new Error('Asado: unexpected product, headers, or unit');
  const years = rows[header];
  const monthNames = rows[header + 1];
  const product = products[0];
  let year: string | undefined;
  const observations: Observation[] = [];
  for (let column = 2; column < monthNames.length; column++) {
    const yearMatch = String(years[column] ?? '').match(/^(?:Año\s+)?(20\d{2})$/i);
    if (yearMatch) year = yearMatch[1];
    const monthLabel = label(monthNames[column]);
    if (!monthLabel) continue;
    const month = months.indexOf(monthLabel);
    if (!year || month < 0) throw new Error(`Asado: unexpected date in column ${column + 1}`);
    const value = product[column];
    if (value == null || value === '') continue; // Missing observations remain absent.
    if (typeof value !== 'number') throw new Error(`Asado: nonnumeric price in column ${column + 1}`);
    observations.push({ date: `${year}-${String(month + 1).padStart(2, '0')}-01`, value });
  }
  return validateObservations(observations, 'asado-gba');
}
