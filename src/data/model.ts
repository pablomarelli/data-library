export type Language = 'es' | 'en';
export type Localized = Record<Language, string>;
export type Observation = { date: string; value: number; buy?: number | null };
export type Series = {
  id: string;
  name: Localized;
  description: Localized;
  unit: string;
  frequency: 'daily' | 'monthly';
  provider: string;
  sourceUrl: string;
  licenseUrl: string;
  license: Localized;
  notes: Localized;
  observations: Observation[];
};
export type CatalogEntry = Omit<Series, 'observations'> & {
  start: string; end: string; count: number; csv: string; json: string;
};
export type Catalog = { generatedAt: string; calculationVersion: string; entries: CatalogEntry[] };
export type Aggregation = 'close' | 'mean';
export type MonthlyRate = { date: string; close: number; mean: number; count: number; quoteDate: string };
export type ChartInputs = {
  generatedAt: string;
  cpi: Observation[];
  asado: Observation[];
  salary: Observation[];
  salaryRegular: Observation[];
  rates: Record<string, MonthlyRate[]>;
};
export type PorcelPoint = { date: string; ars: number; usd: number | null; rate: number | null; quoteDate: string | null; count: number };
export type AsadoPoint = PorcelPoint & { asadoPrice: number | null; asadoKg: number | null; asadoIndex: number | null };
