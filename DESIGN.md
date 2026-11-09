---
name: data-library
description: Bilingual economic analysis with paired light and dark themes.
colors:
  ground: '#f5f7fa'
  surface: '#ffffff'
  soft: '#ecf1f7'
  ink: '#192b45'
  muted: '#52657d'
  line: '#d4dde8'
  accent: '#1e4a91'
  accent-soft: '#e6eefb'
  ars: '#2866c5'
  usd: '#a94d19'
  dark-ground: '#101a2c'
  dark-surface: '#152238'
  dark-soft: '#1c2d46'
  dark-ink: '#e2eaf7'
  dark-muted: '#a6b7d0'
  dark-line: '#334763'
  dark-accent: '#a9c9ff'
  dark-accent-soft: '#253e60'
  dark-ars: '#69c9f3'
  dark-usd: '#f2b26c'
typography:
  display:
    fontFamily: Manrope Variable, sans-serif
    fontSize: clamp(28px, 3.1vw, 43px)
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: '-0.035em'
  body:
    fontFamily: Source Sans 3 Variable, sans-serif
    fontSize: 16px
    lineHeight: 1.55
rounded:
  control: 6px
  panel: 12px
spacing:
  compact: 8px
  standard: 16px
  section: 28px
components:
  button-primary:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.surface}'
    rounded: '{rounded.control}'
    padding: 8px 14px
---

# Design System: data-library

## Overview

The implemented design follows the user's paired theme choice: a restrained light view and an expressive dark view. Both show the same controls, content, and data. The chart leads; source evidence follows.

## Colors

Blue identifies ARS. Warm brown or amber identifies USD. Neutral surfaces separate controls from the plot. Dark mode maps the same semantic roles to navy surfaces and brighter series colors.

## Typography

Manrope identifies headings and the library brand. Source Sans 3 carries descriptions, controls, and data. Numeric readouts use tabular figures. Body text uses short reading columns; method text has a maximum width of 74 characters.

## Layout

The centered shell has a maximum width of 1520px and desktop side padding of 40px. A 196px left sidebar and 36px gap frame the content. At intermediate desktop widths the sidebar becomes 170px with a 24px gap. At 900px and below, navigation becomes an expandable menu above the content. Breakpoints at 1000px and 700px reduce spacing and stack controls. The plot height changes from 380px to 310px. Mobile tables scroll within their containers.

## Elevation & Depth

Borders and surface tones define structure. Only hover readouts use a shadow: `0 5px 20px #00000018`. Dark chart glow is restrained and does not replace the line itself.

## Shapes

Controls use 6px corners. The main chart panel uses 12px corners. Dataset rows use flat dividers and expand into a source detail area.

## Components

- Sidebar navigation groups charts under section headings. The current route uses a tinted background and stronger text. Mobile navigation exposes expansion state and supports Escape to close and restore focus.
- Segmented controls expose selection with `aria-pressed` and a tinted background.
- Focus uses a 3px ARS-colored outline with 4px offset.
- The chart provides hover readouts, a keyboard month inspector, a table, and CSV export.
- Chart transitions use 350ms in light mode and 700ms in dark mode. Reduced motion disables them.
- The skip link focuses the current main content without changing its route.

## Do's and Don'ts

- Do retain the same information in both themes and languages.
- Do pair series colors with text labels and units.
- Do show missing observations as gaps.
- Do keep mobile controls and tables keyboard-accessible.
- Don't infer equal values from line crossings on independent axes.
- Don't add decorative cards around every paragraph.
