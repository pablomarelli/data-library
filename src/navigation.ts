import type { Localized } from './data/model';

export type ChartSection = {
  id: string;
  title: Localized;
  charts: { page: 'analysis' | 'salary'; title: Localized }[];
};

/** Add future categories and their published charts here. */
export const chartSections: ChartSection[] = [
  {
    id: 'economy',
    title: { es: 'Economía', en: 'Economy' },
    charts: [
      { page: 'analysis', title: { es: 'Porcel Jr.', en: 'Porcel Jr.' } },
      { page: 'salary', title: { es: 'Salario promedio', en: 'Average salary' } },
    ],
  },
];

export function chartLink(page: string, currentPage: string) {
  const query = new URLSearchParams(location.search);
  if (page !== currentPage) for (const key of ['from', 'to', 'asado']) query.delete(key);
  return `?${query}#${page}`;
}
