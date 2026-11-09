import { useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { curveLinear, line } from 'd3-shape';
import { useReducedMotion } from 'motion/react';
import { LineChart, Line } from '../vendor/bklit/line-chart';
import { Grid } from '../vendor/bklit/grid';
import { YAxis } from '../vendor/bklit/y-axis';
import { useChartHover, useChartStable, useYScale } from '../vendor/bklit/chart-context';
import type { AsadoPoint, Language } from '../data/model';
import { locale, month, number, text } from '../i18n';

/** Bklit's stock line maps nulls to SVG y=0. Preserve gaps with a custom path
 * only when required, using the same Bklit scales, grid, and hover context. */
function GapAwareLine({ dataKey, yAxisId, stroke, dark }: { dataKey: string; yAxisId: string; stroke: string; dark: boolean }) {
  const { data, xAccessor, xScale } = useChartStable();
  const yScale = useYScale(yAxisId);
  if (data.every(row => typeof row[dataKey] === 'number' && Number.isFinite(row[dataKey]))) {
    return <Line dataKey={dataKey} yAxisId={yAxisId} stroke={stroke} curve={curveLinear} fadeEdges={false} strokeWidth={2.5} glow={dark ? { blur: 3, opacity: 0.35 } : false} highlight={{ dimOpacity: 0.7 }} />;
  }
  const path = line<Record<string, unknown>>()
    .defined(row => typeof row[dataKey] === 'number' && Number.isFinite(row[dataKey]))
    .x(row => xScale(xAccessor(row)) ?? 0)
    .y(row => yScale(row[dataKey] as number) ?? 0)(data);
  return <path data-testid={`gap-line-${dataKey}`} d={path ?? ''} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />;
}

/** Axis labels sit outside the plot reveal clip, including with normal motion. */
function AxisLabels({ children }: { children: ReactNode }) {
  const { containerRef, width, height, margin } = useChartStable();
  if (!containerRef.current) return null;
  return createPortal(<svg className="chart-axis-layer" width={width} height={height} aria-hidden="true">
    <g transform={`translate(${margin.left}, ${margin.top})`}>{children}</g>
  </svg>, containerRef.current);
}

function DateAxis({ language }: { language: Language }) {
  const { xScale, innerHeight, innerWidth } = useChartStable();
  const ticks = xScale.ticks(innerWidth < 450 ? 3 : 7);
  const yearsOnly = (xScale.domain()[1].getTime() - xScale.domain()[0].getTime()) > 3 * 365.25 * 86400000;
  return <AxisLabels><g data-testid="axis-date">{ticks.map(date => <text key={date.getTime()} x={xScale(date)} y={innerHeight + 28} textAnchor="middle" className="chart-date">{yearsOnly ? date.getFullYear() : new Intl.DateTimeFormat(locale(language), { month: 'short', year: '2-digit' }).format(date)}</text>)}</g></AxisLabels>;
}

function ChartReadout({ language, asado = false }: { language: Language; asado?: boolean }) {
  const { tooltipData } = useChartHover();
  const { containerRef, innerHeight, width, margin } = useChartStable();
  if (!tooltipData || !containerRef.current) return null;
  const point = tooltipData.point;
  const date = point.date instanceof Date ? point.date.toISOString().slice(0, 10) : String(point.date);
  return <>
    <line x1={tooltipData.x} x2={tooltipData.x} y1={0} y2={innerHeight} stroke="var(--muted)" strokeDasharray="3 5" />
    {createPortal(<div className="chart-tooltip" style={{ left: Math.max(4, Math.min(width - 242, tooltipData.x + margin.left + 16)), top: 8 }}>
      <strong>{month(date, language, true)}</strong>
      <span><i className="swatch ars" /> ARS <b>{number(point.ars as number, language)}</b></span>
      <span><i className="swatch usd" /> USD <b>{number(point.usd as number | null, language)}</b></span>
      {asado && <>
        <span><i className="swatch asado" /> kg <b>{number(point.asadoKg as number | null, language, 1)}</b></span>
        <span>ARS / kg <b>{number(point.asadoPrice as number | null, language, 2)}</b></span>
      </>}
    </div>, containerRef.current)}
  </>;
}

function RightAxis({ yAxisId, language, offset, unit, color }: { yAxisId: string; language: Language; offset: number; unit: string; color: string }) {
  const { innerWidth } = useChartStable();
  const scale = useYScale(yAxisId);
  const format = (value: number) => new Intl.NumberFormat(locale(language), { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  return <AxisLabels><g className="extra-y-axis" data-testid={`axis-${yAxisId}`} fill={color}>
    <text x={innerWidth + offset} y={-12}>{unit}</text>
    {scale.ticks(5).map(value => <text key={value} x={innerWidth + offset} y={scale(value)} dominantBaseline="middle">{format(value)}</text>)}
  </g></AxisLabels>;
}

export default function EconomicChart({ points, language, dark, showAsado = false, title, arsLabel }: { points: AsadoPoint[]; language: Language; dark: boolean; showAsado?: boolean; title: string; arsLabel: string }) {
  const reduced = useReducedMotion();
  const data = useMemo(() => points.map(row => ({ ...row, date: new Date(`${row.date}T12:00:00Z`) })), [points]);
  const hasUsd = points.some(row => row.usd != null);
  const hasAsado = showAsado && points.some(row => row.asadoKg != null);
  const compact = (value: number) => new Intl.NumberFormat(locale(language), { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  return <div className="chart-figure" role="img" aria-label={`${title}. ${arsLabel}: ARS. ${text[language].usd}: USD. ${showAsado ? `${text[language].asadoKg}: kg. ` : ''}${text[language].tableCaption}`}>
    <div className="axis-titles"><span>{text[language].pesosAxis}</span>{!hasAsado && <span>{text[language].dollarAxis}</span>}</div>
    <LineChart data={data} aspectRatio="" style={{ height: 'var(--plot-height)', touchAction: 'pan-y' }} margin={{ top: 24, left: 49, right: hasAsado ? 96 : 49, bottom: 40 }} animationDuration={reduced ? 0 : dark ? 700 : 350} yDomainTween={!reduced}>
      <Grid horizontal vertical={false} strokeDasharray="2 5" numTicksRows={5} />
      <YAxis yAxisId="ars" formatValue={compact} numTicks={5} />
      {hasUsd && (hasAsado ? <RightAxis yAxisId="usd" language={language} offset={8} unit="USD" color="var(--usd)" /> : <YAxis yAxisId="usd" orientation="right" formatValue={compact} numTicks={5} />)}
      {hasAsado && <RightAxis yAxisId="asadoKg" language={language} offset={53} unit="kg" color="var(--asado)" />}
      <DateAxis language={language} />
      <GapAwareLine dataKey="ars" yAxisId="ars" stroke="var(--ars)" dark={dark} />
      {hasUsd && <GapAwareLine dataKey="usd" yAxisId="usd" stroke="var(--usd)" dark={dark} />}
      {hasAsado && <GapAwareLine dataKey="asadoKg" yAxisId="asadoKg" stroke="var(--asado)" dark={dark} />}
      <ChartReadout language={language} asado={showAsado} />
    </LineChart>
  </div>;
}
