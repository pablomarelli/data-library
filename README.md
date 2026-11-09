# data-library

Public economic data and analysis for `data.pablomarelli.dev`. Built with React, TypeScript, Vite, and vendored Bklit chart components. Spanish and English share the same datasets. Light and dark themes are available for comparison.

## Run locally

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Build and preview the static site:

```sh
npm run build
npm run preview -- --host 192.168.100.8 --port 4173 --strictPort
```

Use your machine's current LAN address in place of the example address. The preview serves only the build in `dist/`.

## Checks

```sh
npm run check
npx playwright install chromium
npm run test:e2e
```

Checks cover lint, TypeScript, economic calculations, production compilation, browser interactions, accessibility, downloads, error recovery, and mobile overflow. Browser tests use the production build. Rebuild after source changes. `TEST_BASE_URL` can target an existing preview.

## Architecture

- `data/raw/`: immutable downloaded source snapshots, with SHA-256 integrity hashes.
- `data/snapshot.json`: selected snapshot manifest.
- `scripts/sources.ts`: download endpoints.
- `scripts/fetch-data.ts`: download and record a new snapshot.
- `scripts/build-data.ts`: validate, normalize, link CPI, aggregate rates, and publish datasets.
- `public/data/`: generated CSV/JSON datasets, catalog, provenance, and chart inputs. Regenerate these files with the script.
- `src/data/calculations.ts`: economic calculations independent of React and charts.
- `src/components/Analysis.tsx`: controls, month inspector, table, and filtered CSV export.
- `src/components/Catalog.tsx`: searchable dataset metadata and downloads.
- `src/components/EconomicChart.tsx`: Bklit scales, axes, interaction, and gap-aware paths.
- `src/i18n.ts`: Spanish and English text and number formatting.
- `src/styles.css`: shared responsive light and dark design.

The browser reads local static JSON. It does not call source providers. Fonts are bundled. Language and theme persist in local storage and URL parameters. Analysis parameters also persist in the URL. Routes use `#analysis` for Porcel, `#salary` for average salary, `#data` for the catalog, and `#methodology` or `#salary-methodology` for each analysis's source notes. The left sidebar groups charts by topic and resets the date range when changing analyses. On screens up to 900px wide, it becomes a keyboard-accessible expandable menu. `src/navigation.ts` defines bilingual section titles and chart links; add future topics there alongside their implemented routes. Economy is the first published section.

## Refresh data

```sh
npm run data:fetch
npm run data:build
npm run check
npm run test:e2e
```

Review coverage and source changes before publishing. Fetching creates a new timestamped snapshot and preserves older files. Building verifies hashes, dates, duplicate observations, positive values, and CPI overlap. It validates all series before replacing the published data directory. Restore an older `data/snapshot.json` from its raw snapshot manifest to rebuild an earlier release. No scheduled refresh is configured.

## Porcel methodology

This is an independent reconstruction of the chart attributed to `@lapaulvolcker`. The original spreadsheet was not available, so exact replication is not claimed.

1. Start with ARS 20,000 in October 2012.
2. Preserve purchasing power using a linked consumer price index (CPI).
3. Use San Luis CPI through April 2016, Greater Buenos Aires CPI through June 2017, and national CPI thereafter.
4. Link monthly index ratios at overlapping months without intermediate rounding.
5. Divide the resulting ARS amount by the selected ARS/USD selling rate.

The default rate is the last published quote in each complete month. The alternative mean includes all provider rows, including repeated weekend prices. Missing observations remain missing. USD values are nominal and do not account for US inflation. The chart's axes have independent scales.

The selected snapshot was retrieved on 2026-11-08. National CPI ends in August 2026, which limits the Porcel analysis. The historical OECD/FRED reference starts in January 1989. The source already converts pre-1992 australes to peso currency units. Do not divide those values by 10,000 again. CCL begins in January 2013, MEP in October 2018, card rates in December 2019, and crypto in February 2023. The catalog records exact coverage for all 16 datasets.

## Average salary analysis

`#salary` defaults to the official normal and permanent gross-pay estimate. The Salary series selector also offers original gross pay including bonuses. Both show nominal pesos, dollars, and kilograms of asado on the same plot. Asado is enabled by default. They reuse the date controls, dollar-rate choices, axes, inspector, table, and CSV export from the Porcel analysis.

### Regular-pay estimate (default)

- `salary-private-regular` comes from OEDE's official monthly remuneration workbook, sheet `C 1`, normal and permanent remuneration, `Serie Desestacionalizada`, `En $`.
- Coverage in this snapshot: January 1995 through June 2026, 378 observations. It is not extended to July using the original-pay CSV.
- OEDE uses X-12 ARIMA seasonal adjustment and an August-based level factor to remove the influence of the semiannual bonus and other seasonal pay. This is an official estimate, not observed take-home pay and not the trend-cycle column. The app adds no further smoothing or CPI adjustment.
- The parser locates the labeled column, normalizes the source's month/year dates (some underlying Excel serials use day 2), validates observations, and preserves full numeric precision.
- The workbook and original CSV are separate publication vintages. Each retains its own coverage, source notes, and terms. No splice is performed.
- `pay=regular` selects this estimate; `pay=total` selects original gross pay. Switching resets dates to the selected source's full coverage. Exports identify the selected dataset and source.

### Original gross pay (optional)

- Source: Secretaría de Trabajo / OEDE, based on SIPA; distributed by SSPM through Datos Argentina, dataset 153, CC BY 4.0.
- Coverage in the current snapshot: January 1995 through July 2026, 379 monthly observations.
- Measure: arithmetic mean gross pay per employment relationship, not median pay, take-home pay, or the average for all workers.
- Includes the semiannual bonus (aguinaldo) and other periodic pay. June and December peaks are retained. No CPI adjustment, smoothing, bonus removal, or median substitution is applied.
- The latest two years are provisional and may be revised. The source snapshot is archived on each refresh.
- USD = original monthly ARS pay / selected same-month exchange rate. Asado kg = original monthly ARS pay / same-month INDEC GBA price. Missing denominators remain missing. Gross-pay equivalents are not disposable-income budgets.

`scripts/parse-salary.ts` selects the average column by its header name and validates monthly dates and positive values. `salary-private-gross` is available in the catalog under Salaries. Source research, coverage details, and the reason for choosing this series over RIPTE are in `docs/research/average-salary-sources.md`. `src/analysisCopy.ts` separates source-specific bilingual content from shared analysis controls; `SalaryMethodology.tsx` documents the population and calculation.

### Asado purchasing power and price index

The optional “Show kilograms of asado” checkbox adds the kilogram line to the same plot as pesos and dollars. Pesos use the left Y-axis; dollars and kilograms have separate labeled scale columns on the right. All series share the date axis and hover readout. The URL parameter `asado=1` restores the option. With the option enabled, the table and CSV export include kilograms, ARS/kg, and the price index.

- `asado-price`: INDEC's monthly average raw asado cut price for Greater Buenos Aires, ARS/kg, April 2016 through September 2026 in the current snapshot.
- `asado-index`: nominal price index, calculated as `100 × monthly price / April 2016 price`. This is an independently calculated index, not an official INDEC index.
- Kilograms: `inflation-adjusted salary ARS / same-month asado ARS/kg`. Dollar-rate selection does not affect this calculation. No prices are estimated before source coverage or within gaps. Analysis ends at the latest available CPI month, even when the price source extends further.

The measure covers purchased raw meat, not a complete meal or cooked portions. It excludes side dishes, drinks, fuel, and cooking loss. INDEC material is attributed under CC BY-SA 4.0; these normalized and derived asado datasets retain that license.

`scripts/parse-asado.ts` reads the archived binary XLS workbook with the build-only `@e965/xlsx` parser. It selects the GBA sheet and Asado/kg row by label, handles merged year headers and separator columns, and validates dates and positive prices. Normal refresh commands download and parse the workbook automatically. Source research and limitations are recorded in `docs/research/asado-sources.md`.

Source rights are separate from application code. Each catalog entry records provider terms and attribution. Public availability does not imply an unrestricted licence.

## Bklit provenance

`src/vendor/bklit/PROVENANCE.json` records upstream registry URLs and response hashes. `src/vendor/bklit/LICENSE` retains the upstream licence. `scripts/vendor-bklit.ts` imports registry code. Review changes before running it, because it overwrites vendor files.

The stock Bklit line path maps missing values to an SVG coordinate. `EconomicChart.tsx` uses a custom path when values are missing, so gaps remain visible. Complete series retain Bklit line animation. Reduced-motion preferences are respected.

## Static deployment

Run `npm ci` and `npm run build`, then publish the contents of `dist/` with any static host. Serve the site at the domain root with HTTPS. Hash routes need no server-side routing. Serve JSON and CSV with their normal MIME types. Cache hashed assets for a long duration; revalidate HTML and `/data/` files when a new snapshot is published.

Configure `data.pablomarelli.dev` in the chosen host and add its required DNS records. Hosting and DNS deployment are pending. The local preview is temporary.
