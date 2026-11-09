# Analysis and dataset catalog

Mode: Read, with chart exploration controls.

## Direction contract

THESIS: A bilingual economic reading room. The chart is the first useful object, followed by its evidence. No marketing hero or invented metrics.

OWN-WORLD: User-pinned paired treatments: cool white with ink-blue lines for daytime reading; deep navy with cyan and amber luminous lines for evening exploration. A shared broad plot, compact controls, clear units, and structured source ledger connect the two.

STORY: Understand the purchasing-power question, compare dates and dollar rates, then inspect the calculation and download reusable datasets.

FIRST VIEWPORT: Compact library masthead, analysis/catalog navigation, a left-aligned title and short explanation, then a wide chart with explicit axis units and date/rate controls. Hover reveals bilingual values; a keyboard month inspector gives equivalent access.

FORM: User-pinned light and dark comparisons override seed 30171189. Consistent chart scale and calm reading column take precedence over decorative challengers. Both modes retain exactly the same data and controls.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Asado extension

An optional checkbox overlays the kilogram line on the ARS/USD plot. All three series share one date axis and hover readout. ARS labels remain on the left; USD and kg use separate color-matched scale columns on the right. Green identifies asado, with `--asado: #237660` in light mode and `#83d9b3` in dark mode. The shared month inspector, table, and export expose kilograms, monthly ARS/kg, and the April 2016 = 100 price index. The catalog adds a Food filter. Coverage begins at the first INDEC GBA observation; missing prices remain gaps.

## Average salary analysis

The analysis selector links Porcel Jr. and Average salary. The salary route retains the same chart and controls, with all three measures enabled by default. Source-specific headings identify registered private-sector gross pay. The visible introduction and methodology explain coverage, bonuses, and the distinction from take-home pay. Chart color roles remain ARS, USD, and kg. The salary dataset has its own catalog filter and download. Route changes reset date controls to the selected source's coverage.

The Salary series selector defaults to the official normal and permanent estimate, with original gross pay including bonuses available alongside it. Place this source selector above exchange-rate controls. The title, legend, source link, methodology, inspector, and exports follow the selected series. Explain that switching resets the date range and that source vintages have different end dates.

## Sectioned navigation

The left sidebar replaces the horizontal analysis selector. Economy contains Porcel Jr. and Average salary. Published sections and bilingual titles come from `src/navigation.ts`, allowing future topics such as Football when charts exist. Keep the data library below the chart groups and source-method links above the main content. On mobile, use an inline expandable menu that closes after navigation; Escape restores focus to its toggle. Do not add empty or disabled categories as placeholders.
