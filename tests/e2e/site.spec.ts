import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('skip navigation preserves catalog route and state', async ({ page }) => {
  await page.goto('/?lang=en#data');
  await page.getByRole('searchbox').fill('historical');
  const dataset = page.getByRole('button', { name: /Historical reference dollar/ });
  await dataset.click();
  await page.getByRole('link', { name: 'Skip to content' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#data$/);
  await expect(page.locator('main')).toBeFocused();
  await expect(page.getByRole('searchbox')).toHaveValue('historical');
  await expect(dataset).toHaveAttribute('aria-expanded', 'true');
});

test('bilingual analysis, real data, rate controls, download and theme persistence', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?from=2012-10');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('salario digno');
  await expect(page.locator('.chart-figure svg').first()).toBeVisible();
  await expect(page.getByTestId('gap-line-usd')).toHaveAttribute('d', /M.+L/);
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByLabel('Dollar rate', { exact: true }).selectOption('usd-blue');
  await page.getByLabel('Monthly exchange rate', { exact: true }).selectOption('mean');
  await expect(page.locator('.chart-notes')).toContainText('Not a trading-day average');
  const latest = await page.getByLabel('To', { exact: true }).inputValue();
  const threeYearsAgo = `${Number(latest.slice(0, 4)) - 3}${latest.slice(4)}`;
  await page.getByRole('button', { name: '3 years', exact: true }).click();
  await expect(page.getByLabel('From', { exact: true })).toHaveValue(threeYearsAgo);
  await page.getByLabel('Explore a month').focus();
  await page.keyboard.press('Home');
  await expect(page.locator('.inspector-date strong')).toHaveText(new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${threeYearsAgo}-01T12:00:00Z`)));
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('usd-blue-mean');
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.getByLabel('Dollar rate', { exact: true })).toHaveValue('usd-blue');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(errors).toEqual([]);
});

test('catalog search, metadata, downloaded observations and navigation', async ({ page, request }) => {
  await page.goto('/?lang=en#data');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Data that lives beyond a chart.');
  await page.getByRole('searchbox').fill('historical');
  await page.getByRole('button', { name: /Historical reference dollar/ }).click();
  await expect(page.locator('.dataset-description')).toContainText('do not divide by 10,000 again');
  const response = await request.get('/data/usd-reference.csv');
  expect(await response.text()).toContain('1989-01-01');
  await page.getByRole('searchbox').fill('nonexistent');
  await expect(page.getByText('No datasets match this search.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.dataset-row')).toHaveCount(16);
  await page.getByRole('link', { name: 'Sources & method', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A meme. A transparent calculation.' })).toBeInViewport();
});

test('fetch failure has a working retry', async ({ page }) => {
  await page.route('**/data/chart-inputs.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('/?lang=en');
  await expect(page.getByRole('alert')).toContainText('We could not load the data');
  await page.unroute('**/data/chart-inputs.json');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('.chart-figure')).toBeVisible();
});

test('invalid range and missing rate coverage remain explicit', async ({ page }) => {
  await page.goto('/?lang=en');
  await page.getByLabel('Dollar rate', { exact: true }).selectOption('usd-cripto');
  await page.getByLabel('From', { exact: true }).fill('2012-10');
  await page.getByLabel('To', { exact: true }).fill('2014-01');
  await expect(page.locator('.chart-notes')).toContainText('Exchange rates are missing');
  await expect(page.locator('.inspector-value').last()).toContainText('No data');
  await page.getByLabel('From', { exact: true }).fill('2020-01');
  await expect(page.getByRole('alert')).toHaveText('The start date must be before the end date.');
  await expect(page.getByRole('button', { name: 'Download CSV' })).toBeDisabled();
});

test('light and dark desktop/mobile views have no accessibility violations or overflow', async ({ page }) => {
  for (const [theme, width] of [['light', 1440], ['dark', 1440], ['light', 390], ['dark', 390]] as const) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/?lang=es&theme=${theme}`);
    await expect(page.locator('.chart-figure svg').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
    await page.screenshot({ path: `.impeccable/review/${width === 1440 ? 'desktop' : 'mobile'}-${theme}.png`, fullPage: true });
  }
  await page.goto('/?lang=en#data');
  await page.getByRole('button', { name: /Historical reference dollar/ }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
  await page.screenshot({ path: '.impeccable/review/mobile-catalog.png', fullPage: true });
});
