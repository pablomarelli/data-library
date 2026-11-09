import type { Language } from './data/model';
import { text } from './i18n';

export type AnalysisKind = 'porcel' | 'salary';
export type SalaryBasis = 'regular' | 'total';

const salaryCopy = {
  es: {
    title: '¿Cuánto compra el salario promedio?', subtitle: 'Empleo privado registrado.',
    intro: 'La remuneración bruta promedio del empleo privado registrado en Argentina, expresada en pesos, dólares y kilos de asado. Incluye aguinaldo: no es salario de bolsillo ni representa a todos los trabajadores.',
    chartTitle: 'Salario bruto promedio · SIPA', base: 'Por relación laboral · incluye aguinaldo · Argentina',
    reconstruction: 'Serie oficial · promedio bruto', ars: 'Salario bruto promedio',
    latest: 'Último mes con salario disponible',
    asadoNote: 'Kilos equivalentes = salario bruto en ARS / precio promedio por kg. Es el corte asado crudo de GBA. No representa el presupuesto disponible después de aportes y otros gastos.',
    readTitle: 'Un salario, tres medidas',
    readArs: 'La línea en pesos muestra la media bruta declarada por relación laboral privada registrada. No se ajusta por inflación. Los picos de junio y diciembre incluyen el aguinaldo.',
    readUsd: 'Dólares y kilos son conversiones del salario del mismo mes. Dependen de la cotización elegida y del precio del asado. No miden el ingreso disponible después de descuentos.',
  },
  en: {
    title: 'What can the average salary buy?', subtitle: 'Registered private-sector jobs.',
    intro: 'Average gross pay in Argentina’s registered private-sector jobs, expressed in pesos, dollars, and kilograms of asado. Includes the semiannual bonus: it is not take-home pay and does not represent all workers.',
    chartTitle: 'Average gross pay · SIPA', base: 'Per employment relationship · includes bonuses · Argentina',
    reconstruction: 'Official series · gross average', ars: 'Average gross pay',
    latest: 'Latest month with available salary data',
    asadoNote: 'Equivalent kilograms = gross salary in ARS / average price per kg. This is the raw GBA asado cut. It is not the available budget after employee contributions and other expenses.',
    readTitle: 'One salary, three measures',
    readArs: 'The peso line shows declared mean gross pay per registered private-sector job. It is not inflation-adjusted. June and December peaks include the semiannual bonus.',
    readUsd: 'Dollars and kilograms convert the same month’s salary. They depend on the selected exchange rate and asado price. They do not measure disposable income after deductions.',
  },
};

export function analysisCopy(language: Language, kind: AnalysisKind, basis: SalaryBasis = 'total') {
  if (kind !== 'salary') return text[language];
  const copy = { ...text[language], ...salaryCopy[language] };
  if (basis === 'total') return copy;
  return { ...copy, ...(language === 'es' ? {
    intro: 'La remuneración bruta promedio del empleo privado registrado, en pesos, dólares y kilos de asado. La estimación oficial normal y permanente excluye la influencia del aguinaldo y otros conceptos estacionales. No es salario de bolsillo.',
    chartTitle: 'Salario normal y permanente · SIPA',
    base: 'Estimación oficial desestacionalizada · bruto por relación laboral',
    reconstruction: 'Serie oficial · estimación ajustada', ars: 'Salario normal y permanente',
    readArs: 'La línea en pesos usa la estimación oficial normal y permanente. El organismo ajusta la estacionalidad y excluye la influencia del aguinaldo y otros pagos estacionales. No aplicamos un suavizado adicional ni ajuste por inflación.',
  } : {
    intro: 'Average gross pay in registered private-sector jobs, in pesos, dollars, and kilograms of asado. The official regular-pay estimate removes the influence of the semiannual bonus and other seasonal payments. It is not take-home pay.',
    chartTitle: 'Regular pay estimate · SIPA',
    base: 'Official seasonally adjusted estimate · gross per job',
    reconstruction: 'Official series · adjusted estimate', ars: 'Regular pay estimate',
    readArs: 'The peso line uses the official normal and permanent pay estimate. The agency adjusts seasonality and removes the influence of the semiannual bonus and other seasonal payments. We apply no additional smoothing or inflation adjustment.',
  }) };
}

export const salarySource = 'https://datos.gob.ar/dataset/remuneracion-bruta-de-los-asalariados-registrados-del-sector-privado';
export const regularSalarySource = 'https://www.argentina.gob.ar/trabajo/estadisticas/oede-estadisticas-nacionales';
