import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

test('separate salary analysis uses original pay and retains all three measures', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?lang=en');
  await page.getByRole('link', { name: 'Average salary', exact: true }).click();
  await page.getByLabel('Salary series', { exact: true }).selectOption('total');
  await expect(page).toHaveURL(/#salary$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('What can the average salary buy?');
  await expect(page.locator('.lead')).toContainText('not take-home pay');
  await expect(page.getByRole('checkbox', { name: 'Show kilograms of asado' })).toBeChecked();
  await expect(page.locator('.chart-figure')).toHaveCount(1);
  await expect(page.getByTestId('axis-usd')).toBeVisible();
  await expect(page.getByTestId('axis-asadoKg')).toBeVisible();
  const inputs = await (await request.get('/data/chart-inputs.json')).json();
  const last = inputs.salary.at(-1);
  await expect(page.getByLabel('From', { exact: true })).toHaveValue('2016-04');
  await expect(page.getByLabel('To', { exact: true })).toHaveValue(last.date.slice(0, 7));
  await expect(page.locator('.inspector-value').first()).toContainText(new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(last.value));
  await expect(page.locator('.legend')).not.toContainText('Adjusted for inflation');
  const kg = last.value / inputs.asado.find((row: { date: string }) => row.date === last.date).value;
  await expect(page.locator('.asado-inspector strong').first()).toHaveText(`${new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(kg)} kg`);
  const promise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV' }).click();
  const download = await promise;
  expect(download.suggestedFilename()).toContain('salary-private-gross');
  const csv = await readFile((await download.path())!, 'utf8');
  expect(csv).toContain(String(last.value));
  expect(csv).toContain('salary-private-gross-v1');
  expect(csv).toContain('CC BY 4.0');
  await page.getByRole('link', { name: 'Sources & method', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Which salary we measure' })).toBeInViewport();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Which salary we measure' })).toBeInViewport();
  await page.getByRole('link', { name: 'Porcel Jr.', exact: true }).click();
  await expect(page.locator('.inspector-value').first()).toContainText('Adjusted for inflation');
  await expect(page.getByLabel('From', { exact: true })).toHaveValue('2013-01');
  expect(errors).toEqual([]);
});

test('default range follows visible coverage while explicit history stays available', async ({ page }) => {
  await page.goto('/?lang=en#salary');
  const from = page.getByLabel('From', { exact: true });
  await expect(from).toHaveValue('2016-04');
  await page.getByRole('checkbox', { name: 'Show kilograms of asado' }).uncheck();
  await expect(from).toHaveValue('2013-01');
  await page.getByRole('checkbox', { name: 'Show kilograms of asado' }).check();
  await expect(from).toHaveValue('2016-04');
  await page.locator('.controls select').first().selectOption('usd-bolsa');
  await expect(from).toHaveValue('2018-10');
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(from).toHaveValue('1995-01');
  await page.locator('.controls select').first().selectOption('usd-blue');
  await expect(from).toHaveValue('1995-01');
  await page.reload();
  await expect(from).toHaveValue('1995-01');
  await page.goto('/?lang=en&from=2000-01&to=2010-01#salary');
  await expect(from).toHaveValue('2000-01');
  await expect(page.getByLabel('To', { exact: true })).toHaveValue('2010-01');
});

test('salary catalog provides original observations and scope', async ({ page, request }) => {
  await page.goto('/?lang=en#data');
  await page.getByRole('button', { name: 'Salaries', exact: true }).click();
  await expect(page.locator('.dataset-row')).toHaveCount(2);
  await page.getByRole('button', { name: /Registered private-sector average gross pay/ }).click();
  await expect(page.locator('.dataset-description')).toContainText('not median');
  await expect(page.locator('.dataset-description')).toContainText('CC BY 4.0');
  const response = await request.get('/data/salary-private-gross.csv');
  expect(await response.text()).toContain('"1995-01-01","885.22"');
});

test('regular pay is the default and switching preserves honest coverage and exports', async ({ page, request }) => {
  await page.goto('/?lang=en#salary');
  const select = page.getByLabel('Salary series', { exact: true });
  await expect(select).toHaveValue('regular');
  await expect(page.locator('#chart-title')).toHaveText('Regular pay estimate · SIPA');
  const inputs = await (await request.get('/data/chart-inputs.json')).json();
  const regular = inputs.salaryRegular.at(-1);
  await expect(page.getByLabel('To', { exact: true })).toHaveValue(regular.date.slice(0, 7));
  await expect(page.locator('.inspector-value').first()).toContainText(new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(regular.value));
  await page.getByRole('button', { name: '3 years', exact: true }).click();
  await select.selectOption('total');
  await expect(page.getByLabel('To', { exact: true })).toHaveValue(inputs.salary.at(-1).date.slice(0, 7));
  await expect(page.getByLabel('From', { exact: true })).toHaveValue('2016-04');
  await page.reload();
  await expect(select).toHaveValue('total');
  await select.selectOption('regular');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('salary-private-regular');
  const csv = await readFile((await download.path())!, 'utf8');
  expect(csv).toContain('salary-private-regular-v1');
  expect(csv).toContain(String(regular.value));
  expect(csv).not.toContain('"2026-07"');
  await page.reload();
  await expect(select).toHaveValue('regular');
  await expect(page.getByTestId('axis-asadoKg')).toBeVisible();
});

test('salary chart renders both languages and themes without clipped axes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const [width, theme, lang] of [[1440, 'light', 'en'], [1440, 'dark', 'es'], [390, 'light', 'es'], [390, 'dark', 'en']] as const) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/?lang=${lang}&theme=${theme}#salary`);
    await expect(page.getByTestId('axis-asadoKg')).toBeVisible();
    expect(await page.getByTestId('axis-asadoKg').evaluate(el => !el.closest('[clip-path]'))).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
    await page.screenshot({ path: `.impeccable/review/salary-${width}-${theme}.png`, fullPage: true });
  }
});
