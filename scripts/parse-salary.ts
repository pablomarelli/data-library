import { validateObservations } from '../src/data/calculations';
import { read, utils, SSF } from '@e965/xlsx';

/** Official adjusted level, not the original-pay or trend-cycle columns. */
export function parseRegularSalary(content: Uint8Array) {
  const workbook = read(content, { type: 'buffer' });
  const sheet = workbook.Sheets['C 1'];
  if (!sheet) throw new Error('Regular salary: missing overall average sheet C 1');
  const rows = utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
  const normalize = (cell: unknown) => String(cell ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  const header = rows.findIndex(row => normalize(row[0]) === 'período');
  const column = rows[header]?.findIndex(cell => normalize(cell) === 'serie desestacionalizada');
  if (header < 1 || column == null || column < 0 || normalize(rows[header - 1][column]) !== 'remuneración normal y permanente' || normalize(rows[header + 1][column]) !== 'en $') throw new Error('Regular salary: unexpected series or units');
  return validateObservations(rows.slice(header + 2).filter(row => typeof row[0] === 'number').map(row => {
    const date = SSF.parse_date_code(row[0] as number);
    // The source formats dates as month/year; some serials use day 2.
    if (!date || date.y < 1990 || typeof row[column] !== 'number') throw new Error('Regular salary: invalid monthly observation');
    return { date: `${date.y}-${String(date.m).padStart(2, '0')}-01`, value: row[column] as number };
  }), 'salary-private-regular');
}

/** Select the arithmetic mean by column name, never the adjacent median. */
export function parseSalaryCsv(content: string) {
  const [header, ...lines] = content.trim().split(/\r?\n/);
  const columns = header.replace(/^\uFEFF/, '').split(',');
  const dateColumn = columns.indexOf('indice_tiempo');
  const meanColumn = columns.indexOf('asalariados_priv_remuneracion_promedio');
  if (dateColumn < 0 || meanColumn < 0) throw new Error('Salary: missing date or average column');
  return validateObservations(lines.filter(line => line.trim()).map(line => {
    const values = line.split(',');
    const date = values[dateColumn];
    if (!/^\d{4}-\d{2}-01$/.test(date)) throw new Error('Salary: invalid monthly date');
    return { date, value: Number(values[meanColumn]) };
  }), 'salary-private-gross');
}
