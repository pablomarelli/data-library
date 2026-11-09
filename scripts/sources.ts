export const sources = {
  salaryRegular: 'https://www.argentina.gob.ar/sites/default/files/nacional_serie_remuneraciones_mensual_11.xlsx',
  salary: 'https://infra.datos.gob.ar/catalog/sspm/dataset/153/distribution/153.1/download/remuneracion-bruta-asalariados-registrados-sector-privado-mensual-pesos-base-2009.csv',
  asado: 'https://www.indec.gob.ar/ftp/cuadros/economia/sh_ipc_precios_promedio.xls',
  sanLuis: 'https://infra.datos.gob.ar/catalog/sspm/dataset/197/distribution/197.1/download/indice-precios-consumidor-san-luis-2003-100.csv',
  indec: 'https://apis.datos.gob.ar/series/api/series/?ids=148.3_INIVELNAL_DICI_M_26,101.1_I2NG_2016_M_22&limit=1000',
  reference: 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=ARGCCUSMA02STM&cosd=1989-01-01',
  rates: 'https://api.argentinadatos.com/v1/cotizaciones/dolares',
} as const;
export type SnapshotManifest = { retrievedAt: string; sources: Record<keyof typeof sources, { url: string; file: string; sha256: string }> };
