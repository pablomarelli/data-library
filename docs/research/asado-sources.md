# Monthly asado retail prices: source research

**TL;DR:** Use INDEC's GBA `Asado` series from April 2016 through September 2026 for one consistent, licensed price series; an IPCVA export reaches March 2012 but leaves historical source continuity unclear.

Checked on 2026-11-08. All downloads below were retrieved successfully and their contents were read. No application files were changed.

## 1. Recommended source: INDEC GBA

- Publisher: Instituto Nacional de Estadística y Censos (INDEC).
- Official topic page: https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31
- **Direct machine-readable download:** https://www.indec.gob.ar/ftp/cuadros/economia/sh_ipc_precios_promedio.xls
- Official publication that identifies this historical workbook: https://www.indec.gob.ar/ftp/cuadros/publicaciones/indecinforma/indec_informa_01_24.pdf
- **Exact raw local path:** `/tmp/opencode/asado-indec-sh_ipc_precios_promedio.xls`
- Raw SHA-256: `53cc446fc5b545341a6dc52d35dee17e791960c9ae11903158147d346efb0092`.
- Parsed implementation input: `/tmp/opencode/asado-indec-gba-2016-2026.csv`. This is a research-derived CSV, not an official CSV download.

### Coverage, definition, and schema

The workbook contains `Nacional` and `GBA` sheets. **Use `GBA`, not `Nacional`.** The regional sheet starts in June 2017 but does not contain an `Asado` row. The GBA sheet explicitly covers April 2016 through September 2026. Its `Asado` row contains **126 positive numeric monthly observations**, with no missing months after correct header parsing. This does not provide 2012 prices.

The GBA sheet describes average consumer prices for selected goods in the consumer price index (IPC) basket. The measure is nominal Argentine pesos per kilogram (ARS/kg). It is a regional retail price, not a national average. GBA means the City of Buenos Aires and 24 Greater Buenos Aires districts. See the geographic description in the official IPC report: https://www.indec.gob.ar/uploads/informesdeprensa/ipc_01_2517A7124C09.pdf

Workbook schema, using Excel's one-based row and column positions:

- Row 1: title and coverage.
- Row 3: `Variedad`, `Unidad de medida`, then year headers. Early headers are strings such as `Año 2016`; later headers are numbers such as `2023`.
- Row 4: Spanish month names. Trim whitespace.
- Row 5: `Pesos`.
- Column A: product name. Column B: unit.
- **Row 14: `Asado`, `kg`, followed by monthly numeric prices.** Find the product by label in production rather than assuming its row will never move.
- Columns C through EC contain the dates plus five empty separator columns. Skip columns without a month label. Carry the latest year header across month columns. Do not assume a fixed 13-column year layout: separator columns are not present every year.
- Row 69 explains that the average prices support transparent tracking over time. Row 71 attributes the data to INDEC's price statistics departments.

Derived CSV schema: `month` (`YYYY-MM`), `price_ars_per_kg` (positive decimal number). Retain source, product, geography, units, retrieval date, and raw-file hash as metadata.

Verified workbook values:

| Month | ARS/kg |
| --- | ---: |
| 2016-04 | 100.30 |
| 2016-05 | 100.97 |
| 2017-01 | 111.95 |
| 2017-08 | 122.95 |
| 2023-12 | 5195.96 |
| 2026-08 | 16736.73 |
| 2026-09 | 16836.34 |

The downloaded file ends in September 2026. Do not infer October or November observations from the current date. Archive this snapshot because the stable URL can change as INDEC publishes new months.

### Reuse terms

The official topic page footer states that all website material has a Creative Commons license unless specifically indicated otherwise. It links to **CC BY-SA 4.0**: https://creativecommons.org/licenses/by-sa/4.0/deed.es

The linked INDEC policy is https://www.indec.gob.ar/ftp/cuadros/publicaciones/politica_difusion_indec.pdf. Attribute INDEC, retain the license link, identify transformations, and apply the license's share-alike terms to adapted material where required. No separate exception was found in this workbook.

## 2. IPCVA alternative: actual downloadable 2012 observations

This is a primary industry source, not the national statistics office. IPCVA's official home page directly links its statistics service hosted on Agrositio:

- Official home: https://ipcva.com.ar
- Linked statistics service: https://ipcva.agrositio.com/estadisticas.php
- Consumer-price query: https://ipcva.agrositio.com/estadisticas/vista_precios_consumidor2.php
- **Actual export link returned by the query:** https://ipcva.agrositio.com/estadisticas/vista_precios_consumidor_xls.php?productos=10&desde=2012-01-01&hasta=2026-11-01
- **Exact raw local export:** `/tmp/opencode/asado-ipcva-2012-2026.xls`
- Saved query result: `/tmp/opencode/asado-ipcva-query-2012-2026.html`
- Export SHA-256: `c9d8cf6518fbfc74cac3ab69f5b7a6b7a48dc07a8f1c0d33b13f60c0c8096d3b`.

The form identifies `productos[]=10` as `Asado`. I submitted the form with `mes_desde=01-01`, `ano_desde=2012`, `mes_hasta=11-01`, `ano_hasta=2026`, `productos[]=10`, and `procesar=Procesar`. The resulting page supplied the export URL above. The endpoint was not guessed.

### Export format and verified coverage

Despite its `.xls` label, the response is **an HTML table**, not a binary Excel workbook. It is machine-readable with an HTML table parser. The title is `Precios al Consumidor en Moneda Corriente`. Columns are `Período` and `Asado`.

- Period strings use Spanish abbreviations and two-digit years, such as `Mar-12`, `Abr-12`, and `Sep-26`.
- Price strings contain `$`, a comma decimal separator, and optional dot thousands separators, such as `$ 37,58` or `$ 17.869,00`.
- The HTML query view uses English month abbreviations and dot decimals. Do not apply its parser unchanged to the export.
- The requested January 2012 through November 2026 interval returned **175 consecutive months from March 2012 through September 2026**. January and February 2012 are absent. October and November 2026 are absent. There are no internal month gaps within the returned interval.
- The year selector offers dates back to 1990. This is not evidence that every product has data for every selectable year. Coverage before 2012 was not tested.

Verified export values:

| Month | ARS/kg, subject to historical metadata caveat below |
| --- | ---: |
| 2012-03 | 37.58 |
| 2012-04 | 37.93 |
| 2012-12 | 38.84 |
| 2016-04 | 104.50 |
| 2017-01 | 115.15 |
| 2023-12 | 5052.00 |
| 2026-09 | 17869.00 |

### Unit and geography check, and continuity limitation

IPCVA's home page also links this October 2026 report:

https://api.carneargentina.org.ar/web/uploads/globals/1/Informe%20Mensual%20de%20Precios%20OCT26_compressed.pdf

Downloaded report: `/tmp/opencode/asado-ipcva-oct26.pdf`. Extracted text: `/tmp/opencode/asado-ipcva-oct26.txt`.

Its Table 3 is explicitly `Precios por cortes al consumidor en $/Kg AMBA`. The `Asado de tira` row reports **September 2026 = 17,869** and **October 2026 = 17,744**. The September value exactly matches the export. This verifies the current export's correspondence with the AMBA asado de tira price in ARS/kg. The report describes 80 butcher shops surveyed by telephone and 40 supermarkets surveyed in person in AMBA. It treats Rosario and Córdoba separately.

However, the export query attributes its data to **`INDEC e IPCVA`** without identifying source changes by date. The export itself does not state geography or unit. The current report verifies the recent observations, but does not establish that the same sampling method, geography, and cut definition apply throughout 2012-2026. Do not describe the entire historical export as a proven unchanged IPCVA-only series. Do not append the October PDF value without documenting that additional extraction and its source.

### Reuse terms

The linked statistics service footer states `IPCVA 2026 © Todos los derechos reservados`. No explicit open-data reuse license was found on the examined query, export, home page, or report. A public download alone does not establish an open license. Attribution is necessary but does not resolve this uncertainty. Obtain clear reuse terms before treating this as openly licensed application data.

## 3. Recommended calculations and presentation

Use **INDEC GBA Asado throughout** for both the price index and purchasing-power calculation. It has explicit units, an unambiguous product row, complete observed coverage from April 2016, and clear published reuse terms. Do not splice it with IPCVA to make a longer line. Their prices differ even in overlapping months.

For an observed base month `b`, calculate the nominal asado price index as `100 * P[t] / P[b]`. Label it as an application-derived index, not an official INDEC asado index. A convenient full-year display can start in January 2017, but the underlying data genuinely start in April 2016. Do not label the series `2012 = 100`: there is no 2012 INDEC observation in this file.

Let `S0` be the documented Porcel monthly salary in its original month `t0`. Let `C[t]` be the separately sourced general consumer price index:

```text
inflation_adjusted_salary[t] = S0 * C[t] / C[t0]
kg_of_asado[t] = inflation_adjusted_salary[t] / P[t]
```

The numerator and denominator must both use pesos of month `t`. This estimates the kilograms purchasable with a hypothetical salary that preserves the original salary's general purchasing power. It does not establish Porcel's actual later earnings. If salary values are expressed in constant pesos of another month, convert the meat price to the same price basis before dividing.

The salary amount, salary month, and inflation bridge back to 2012 were not verified in this research. They need separate primary-source support. A later INDEC price series cannot solve a missing earlier inflation baseline. Show asado results only for months supported by both inputs. Leave earlier months unavailable; do not interpolate or backcast them as observed prices.

Suggested label: **“Kilograms of asado cut, INDEC GBA average retail price”**. Explain that `Asado` is the raw meat cut sold by weight. It is not a complete barbecue meal, a restaurant meal, or a generic all-beef average. The calculation excludes other meats, side dishes, drinks, fuel, cooking loss, and serving sizes. It measures purchased kilograms, not edible cooked kilograms or meal portions.

## 4. Implementation handoff

1. Read `/tmp/opencode/asado-indec-sh_ipc_precios_promedio.xls` with a legacy XLS reader such as `xlrd`, or ingest the verified derived CSV `/tmp/opencode/asado-indec-gba-2016-2026.csv`.
2. Preserve the raw snapshot and provenance when moving data into the application's controlled data directory.
3. Check unique monthly keys, positive numeric values, uninterrupted month coverage, and the spot values above. Treat missing data as missing.
4. Keep the data's last observation month separate from the retrieval date.
5. Attribute INDEC and link CC BY-SA 4.0. Label the computed index and salary conversion as application calculations.

Only this research document was added to the workspace. Candidate downloads and the derived CSV are under `/tmp/opencode`.
