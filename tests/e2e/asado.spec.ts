import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

test('optional asado plot, same-month readout, export, URL and missing history', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?lang=en');
  const checkbox = page.getByRole('checkbox', { name: 'Show kilograms of asado' });
  await expect(checkbox).not.toBeChecked();
  await expect(page.getByTestId('axis-asadoKg')).toHaveCount(0);
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('[data-testid="gap-line-asadoKg"]')).toHaveAttribute('d', /M.+L/);
  await expect(page.locator('.chart-figure')).toHaveCount(1);
  await expect(page.getByTestId('axis-asadoKg')).toContainText('kg');
  await expect(page.getByTestId('axis-usd')).toContainText('USD');
  const samePlot = await page.getByTestId('gap-line-asadoKg').evaluate(element => element.closest('svg') === document.querySelector('[data-testid="gap-line-usd"]')?.closest('svg'));
  expect(samePlot).toBe(true);
  const plot = page.locator('.chart-figure');
  await plot.scrollIntoViewIfNeeded();
  const box = (await plot.boundingBox())!;
  await page.mouse.move(box.x + box.width * .6, box.y + box.height * .5);
  await expect(page.locator('.chart-tooltip')).toContainText('ARS');
  await expect(page.locator('.chart-tooltip')).toContainText('USD');
  await expect(page.locator('.chart-tooltip')).toContainText('kg');
  const inputs = await (await request.get('/data/chart-inputs.json')).json();
  const latest = inputs.cpi.at(-1);
  const price = inputs.asado.find((row: { date: string }) => row.date === latest.date).value;
  const kg = 20000 * latest.value / inputs.cpi[0].value / price;
  await expect(page.locator('.asado-inspector strong').first()).toHaveText(`${new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(kg)} kg`);
  await page.getByLabel('Dollar rate', { exact: true }).selectOption('usd-blue');
  await expect(page.locator('.asado-inspector strong').first()).toContainText(new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(kg));
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV' }).click();
  const download = await downloadPromise;
  const csv = await readFile((await download.path())!, 'utf8');
  expect(csv).toContain('asado_kg,asado_price_ars_per_kg,asado_index_2016_04_100');
  expect(csv).toContain('CC BY-SA 4.0');
  expect(csv).toContain(String(kg));
  await page.reload();
  await expect(checkbox).toBeChecked();
  await page.getByLabel('Explore a month').focus();
  await page.keyboard.press('Home');
  await expect(page.locator('.asado-inspector strong').first()).toHaveText('No data');
  await page.getByLabel('To', { exact: true }).fill('2015-12');
  await expect(page.locator('.asado-empty')).toContainText('No asado prices');
  await checkbox.uncheck();
  await expect(page.getByTestId('axis-asadoKg')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('asado catalog exposes prices and derived index with source and license', async ({ page, request }) => {
  await page.goto('/?lang=en#data');
  await page.getByRole('button', { name: 'Food', exact: true }).click();
  await expect(page.locator('.dataset-row')).toHaveCount(2);
  await page.getByRole('button', { name: /Asado price index/ }).click();
  await expect(page.locator('.dataset-description')).toContainText('not an official INDEC index');
  await expect(page.locator('.dataset-description')).toContainText('CC BY-SA 4.0');
  const index = await (await request.get('/data/asado-index.json')).json();
  expect(index.observations[0]).toEqual({ date: '2016-04-01', value: 100 });
});

test('asado view is accessible and fits both themes and viewports', async ({ page }) => {
  for (const [theme, width, language] of [['light', 1440, 'es'], ['dark', 1440, 'en'], ['light', 390, 'en'], ['dark', 390, 'es']] as const) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/?lang=${language}&theme=${theme}&asado=1`);
    await expect(page.locator('[data-testid="gap-line-asadoKg"]')).toHaveAttribute('d', /M.+L/);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
    await page.screenshot({ path: `.impeccable/review/asado-${width}-${theme}.png`, fullPage: true });
  }
});

test('normal motion does not clip dollar, kilogram, or date labels', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/?lang=en&theme=dark&asado=1');
    for (const axis of ['axis-usd', 'axis-asadoKg', 'axis-date']) {
      const labels = page.getByTestId(axis);
      await expect(labels).toBeVisible();
      expect(await labels.evaluate(element => element.closest('[clip-path]') === null)).toBe(true);
      expect(await labels.evaluate(element => {
        const svg = element.closest('svg')!.getBoundingClientRect();
        return [...element.querySelectorAll('text')].every(label => {
          const rect = label.getBoundingClientRect();
          return rect.left >= svg.left && rect.right <= svg.right && rect.top >= svg.top && rect.bottom <= svg.bottom;
        });
      })).toBe(true);
    }
    await page.waitForFunction(() => {
      const path = document.querySelector<SVGPathElement>('[data-testid="gap-line-asadoKg"]');
      const clip = document.querySelector<SVGRectElement>('clipPath[id^="chart-grow-clip"] rect');
      if (!path || !clip) return false;
      const bounds = path.getBBox();
      return clip.x.baseVal.value + clip.width.baseVal.value >= bounds.x + bounds.width;
    });
    await page.locator('.chart-figure').screenshot({ path: `.impeccable/review/asado-normal-motion-${width}.png` });
  }
});
