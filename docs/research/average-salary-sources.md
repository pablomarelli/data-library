# Argentina monthly average remuneration: source decision

## Implementation update: regular-pay option

The user subsequently selected the official normal and permanent estimate as the default. The original all-concepts CSV remains an option. The pipeline now archives and parses the linked OEDE workbook's `C 1` seasonally adjusted level column, retaining its January 1995-June 2026 coverage. It does not use the trend-cycle column or extend the estimate using the original CSV. Example extracted levels: January 1995 = 829.1864827440306; June 2026 = 2184021.058534571. Source cells display month/year; some 2002-2005 serial dates use day 2, which is normalized to the first day of the same reference month. The original research and vintage comparison below remain applicable.

**TL;DR:** Use the official SIPA private-sector gross average CSV, field `asalariados_priv_remuneracion_promedio`, with a precise label and an explicit note that it includes aguinaldo.

Research date: 2026-11-08. This research does not depend on the existing chart pipeline. No app code was changed.

## Recommended source and implementation contract

- **Chart label:** `Remuneración bruta promedio del empleo asalariado privado registrado (SIPA)`.
- Short label: `Salario bruto promedio privado registrado`.
- Subtitle: `Por relación laboral. Incluye aguinaldo y otros pagos periódicos. No es salario de bolsillo.`
- Geography: Argentina, national coverage.
- Unit: nominal current Argentine pesos per month, per employment relationship.
- Primary producer: Secretaría de Trabajo, Empleo y Seguridad Social, Ministerio de Capital Humano. OEDE, the Observatorio de Empleo y Dinámica Empresarial, produces the underlying remuneration statistics from SIPA administrative records.
- CSV publisher: Subsecretaría de Programación Macroeconómica, through Datos Argentina.
- Dataset: `153`; distribution: `153.1`.
- [Dataset and licence](https://datos.gob.ar/dataset/remuneracion-bruta-de-los-asalariados-registrados-del-sector-privado).
- [Resource metadata](https://datos.gob.ar/dataset/remuneracion-bruta-de-los-asalariados-registrados-del-sector-privado/resource/96cbe6fb-3b58-5863-9810-81e30d84dec9).

**Recommended direct download endpoint:**

```text
https://infra.datos.gob.ar/catalog/sspm/dataset/153/distribution/153.1/download/remuneracion-bruta-asalariados-registrados-sector-privado-mensual-pesos-base-2009.csv
```

**Downloaded raw file:**

```text
/tmp/opencode/average-salary-research/sipa-private-official.csv
```

Verified by downloading the bytes, parsing every record, checking dates and values, and computing SHA256. This is an actual data download, not a search-result preview. No authentication was required.

| Property | Verified result |
| --- | --- |
| Format | CSV, comma separator, UTF-8-compatible ASCII content, decimal point |
| Header | `indice_tiempo,asalariados_priv_remuneracion_mediana,asalariados_priv_remuneracion_promedio` |
| Rows | 379 observations, excluding header |
| Coverage | 1995-01-01 through 2026-07-01, monthly |
| Date convention | First day identifies the reference month, not a daily observation |
| Validation | Unique ascending months; no monthly gaps; no empty, non-finite, or non-positive numeric fields |
| Size | 11,437 bytes |
| SHA256 | `044810583a737b8167711a1764137ae68ec2fbba2ea3058ac7677d4d95a4fa95` |

Select the **third column**, the arithmetic average. The second column is the median and must not substitute for the average. Despite `base-2009` in the filename and catalog description, the resource is explicitly in current pesos and the observations are remuneration levels, not a base-100 index. Do not rebase the values.

### Exact raw examples

```csv
indice_tiempo,asalariados_priv_remuneracion_mediana,asalariados_priv_remuneracion_promedio
1995-01-01,546.48,885.22
1995-02-01,526.2,826.49
2025-12-01,2145000.0,2798896.7
2026-01-01,1502823.52,2095254.9
2026-02-01,1509880.18,2100890.25
2026-03-01,1536008.7,2170977.98
2026-04-01,1601005.73,2230140.41
2026-05-01,1607462.08,2150429.17
2026-06-01,2405814.83,3183685.81
2026-07-01,1689226.8711087182,2256861.1202040724
```

These are selected rows, not a contiguous extract. Preserve source precision in storage. Round only for display.

## Scope, gross/net, and payment components

The official [OEDE national statistics page](https://www.argentina.gob.ar/trabajo/estadisticas/oede-estadisticas-nacionales) links the [monthly remuneration workbook](https://www.argentina.gob.ar/sites/default/files/nacional_serie_remuneraciones_mensual_11.xlsx). Its `Metodología` and `Glosario` sheets define the measures:

1. The source covers registered private-sector employees across economic branches nationwide. It does not measure all Argentine workers. Public-sector workers, informal employment, and independent workers are outside this series' stated population.
2. The average is a simple mean of declared remuneration for each employment relationship, identified by the employer-worker CUIT-CUIL combination. A person with multiple jobs is not necessarily one observation.
3. This is **gross remuneration before employee social-security deductions**, not net take-home pay. Do not treat it as a household disposable-income budget.
4. The original `por todo concepto` measure includes non-monthly additions, overtime, travel allowances, **Sueldo Anual Complementario (SAC, aguinaldo)** and vacation bonuses. June and December spikes are meaningful payment seasonality.
5. The administrative total includes remunerative and non-remunerative components. It is broader than RIPTE's capped contribution base. The statistical procedure removes inconsistent values and seeks to exclude dismissal compensation. The glossary explicitly states that the published all-concepts measure excludes indemnizaciones. Do not describe it as completely unprocessed payroll.
6. Family allowances are not remuneration. The methodology nevertheless notes a possible reporting problem: some employers incorrectly include these allowances, and this version of the series could not correct that problem. Its note refers to a proportion near 25% **of workers who receive family allowances**, not 25% of all workers.
7. There is **no 13-month stable-worker selection** for this recommended overall average. The workbook has a separate measure for workers with at least five years of continuity. Do not use that separate table.
8. The latest two years are provisional because employer declarations arrive late. Updates can revise history.

Relevant workbook cells: `Metodología!A7:A9` (gross total, revisions, national coverage), `A14` (cleaning), `A23:A27` (definitions and mean), `A30:A31` (separate continuity subgroup), `A39` (family allowances); `Glosario!A27:A30` (all-concepts exclusions and mean).

### Original versus adjusted pay

The workbook also offers a `normal y permanente` remuneration estimate. It removes the influence of SAC and non-monthly additions such as vacation bonuses, prizes and grants, as well as compensation payments. It first uses X-12 ARIMA seasonal adjustment, then scales using an August-based factor around 0.91 (`Metodología!A25`). It remains a gross remuneration level, but is a statistical estimate rather than the original monthly all-concepts average.

For this implementation, use the CSV original average as one consistent series. Do not mix it with the workbook's adjusted column. Explain the SAC spikes rather than silently smoothing them. If a future product requirement explicitly excludes bonuses, make that a separately labeled series with its own source contract.

## Cross-check and publication-vintage limits

The linked workbook was also downloaded and inspected:

```text
Endpoint: https://www.argentina.gob.ar/sites/default/files/nacional_serie_remuneraciones_mensual_11.xlsx
Local: /tmp/opencode/average-salary-research/sipa-oede-monthly.xlsx
Size: 3227913 bytes
SHA256: a58a5aafd2a7f5bbc5f2b80ff79a10bf670301c5d02da10050a0014e3888e8c1
```

`C 1` is the overall average table. Dates are Excel serial dates in `A8:A385`, original gross levels are in `C8:C385`, adjusted normal/permanent levels are in `F8:F385`, and trend-cycle levels are in `I8:I385`. It has 378 monthly rows, January 1995 through June 2026. `C8 = 885.22` matches the CSV's first average. The table title and notes establish the level's meaning.

The two official files are **different vintages**. For example, the workbook has January 2026 original pay `2096646.76` and June 2026 `3162523.4037033543`; the CSV has `2095254.9` and `3183685.81`. The workbook contains no July observation. The source explicitly allows revisions, but this research cannot establish which overlapping vintage is substantively more accurate. Keep the recommended CSV as a single consistent snapshot; do not splice workbook values into it.

The catalog says its metadata were updated on 2026-08-06, but its coverage-end field still says 2017-04-01. The resource page also has an obsolete data-update field. Use the actual downloaded rows for coverage, not those metadata fields. July 2026 is the latest observation in the recommended file verified on 2026-11-08. This is not a claim that no newer official wage release exists elsewhere.

## Why not RIPTE for this chart?

RIPTE is a valid monthly monetary level with a long history, not merely a wage-change index. However, it has a narrower population and remuneration definition. This research also found a concrete discrepancy in its latest CSV observation. SIPA private-sector gross pay is the clearer choice for a chart labeled average salary.

### Verified RIPTE download

- [Catalog and CC BY 4.0 licence](https://datos.gob.ar/dataset/remuneracion-imponible-promedio-de-los-trabajadores-estables-ripte).
- [Official current publication](https://www.argentina.gob.ar/trabajo/seguridadsocial/ripte).
- [Official methodology, Resolution 2-E/2018, Annex II](https://www.argentina.gob.ar/normativa/nacional/306850/texto).

```text
Endpoint: https://infra.datos.gob.ar/catalog/sspm/dataset/158/distribution/158.1/download/remuneracion-imponible-promedio-trabajadores-estables-ripte-total-pais-pesos-serie-mensual.csv
Local: /tmp/opencode/average-salary-research/ripte-official.csv
Schema: indice_tiempo,ripte
Size: 7436 bytes
SHA256: 2b00bcdb63432c48a0778f2f40e443c7ccf9027ea403efe23a6be7dc140f686b
Rows: 386, monthly, 1994-07-01 through 2026-08-01
```

The CSV passes date-continuity and numeric checks. Exact selected observations:

```csv
indice_tiempo,ripte
1994-07-01,874.87
2026-01-01,1646344.54
2026-06-01,1915878.76
2026-07-01,1946028.12
2026-08-01,1915878.76
```

**Unresolved source discrepancy:** the ministry page publishes August 2026 as **ARS 1,982,518.19**, while the CSV gives **ARS 1,915,878.76**, exactly equal to June. July matches at ARS 1,946,028.12. Do not silently correct or accept the CSV's August value. If RIPTE is later selected, reconcile this discrepancy with the producer or visibly stop at the last validated month.

The tested series API endpoint was:

```text
https://apis.datos.gob.ar/series/api/series/?ids=158.1_REPTE_0_0_5&format=csv&limit=5000
```

It returned HTTP success but only the 21-byte header `indice_tiempo,ripte`, with **zero observations**. Saved as `/tmp/opencode/average-salary-research/ripte-api.csv`. Do not use this tested API request as the production source. Search indexes show historical API rows, but that is not proof that the current request returns observations. The old `sspm-...` catalog slug also returned 404; use the catalog links above.

### Exact RIPTE scope and exclusions

RIPTE means **Remuneración Imponible Promedio de los Trabajadores Estables**. If used, label it `Remuneración imponible promedio de trabajadores estables (RIPTE)`, never `salario promedio de todos los trabajadores`.

According to Annex II and the current ministry page:

- It uses `Remuneración 1` in SICOSS, the remuneration base for personal SIPA contributions. Here, *imponible* means subject to social-security contributions; it does not mean the personal income-tax base.
- It is not net pay and is not unrestricted total gross compensation. It counts remunerative components only, within the applicable contribution-base limits. Non-remunerative amounts and amounts above the maximum base are not represented as total earnings.
- Eligible employment has nonzero personal SIPA contributions in the reference month and each of the previous 12 months. The worker must appear in all 13 declarations.
- It excludes workers with multiple dependent-employment jobs in any of those 13 months.
- Each month's remuneration must meet the applicable minimum contribution base and have the maximum contribution base as its limit.
- It excludes jobs not subject to that cap, such as some special regimes. It also excludes the special domestic-worker regime and independent work. Workers exempt from SIPA or obligated to another pension regime are excluded.
- It includes private-sector employment and national, provincial and municipal public-sector employment whose pension funds were transferred to SIPA. It does not cover all public-sector employees.
- It first divides selected remuneration totals by selected job counts. It then divides January by **1.05**, June by **1.50**, December by **1.54**, and other months by **1.00**. These statistical corrections aim to remove increases from factors including SAC and vacation supplements. They are not a payroll-record exclusion of every bonus. Do not claim that all bonuses are individually removed.
- It has been produced and published since 2006, with historical observations starting July 1994. The ministry states publication can occur up to 45 days after the reference period.
- The ministry explicitly warns that it is a pension-purpose indicator and does not necessarily reflect registered employees' wage behavior. Its narrow selection and concepts do not represent all registered employment or all remuneration.

## Reuse and attribution

Both Datos Argentina catalog pages explicitly assign **Creative Commons Attribution 4.0 (CC BY 4.0)**. The portal also states that public data may be reused with source citation. The [licence terms](https://creativecommons.org/licenses/by/4.0/) permit redistribution and adaptation, including commercial use. Give appropriate credit, link the licence, indicate changes, and do not imply provider endorsement or add restrictions that contradict the licence.

Suggested attribution for the recommended CSV:

> Fuente: Secretaría de Trabajo, Empleo y Seguridad Social / OEDE, en base al SIPA. Distribución: Subsecretaría de Programación Macroeconómica, Datos Argentina, conjunto 153. Licencia CC BY 4.0. Conversión a USD y kg de asado: elaboración propia.

Link the dataset and licence in the chart's source metadata. CC BY 4.0 is verified for the catalog CSV distribution; this note does not infer a separate blanket licence for every ministry document or workbook.

## Instructions for the ARS / USD / asado-kg chart

1. Load the recommended CSV and map `indice_tiempo` to the reference month and `asalariados_priv_remuneracion_promedio` to `salaryArs`.
2. Store the source URL, retrieval date, raw-file SHA256, coverage, and licence with the dataset. Refresh the complete series because recent observations can be revised.
3. Compute `salaryUsd = salaryArs / arsPerUsd` and `asadoKg = salaryArs / asadoArsPerKg` only when the same month has the required denominator.
4. State the exchange-rate definition and monthly aggregation. Align the meat-price geography and unit with its own source. Do not imply that nominal wage conversion is inflation adjustment.
5. Preserve missing months rather than extrapolating salary or denominators. Let each derived series end at the latest shared observation.
6. Call the meat measure a **gross-pay equivalent in kg**, not the amount a worker can actually spend after deductions or living costs.
7. Keep SAC seasonality visible and documented. Do not annualize, divide by 13, remove bonuses again, or mix the mean with the median.

Supporting page snapshots are saved under `/tmp/opencode/average-salary-research/`: `sipa-catalog.html`, `ripte-catalog.html`, `ripte-ministry.html`, and `ripte-methodology.html`. The raw CSVs and XLSX remain unchanged.
