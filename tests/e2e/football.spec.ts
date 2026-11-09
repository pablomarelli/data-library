import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

test('football navigation, search, filters, accessible inspection and export', async ({ page }) => {
  await page.goto('/?lang=en#football');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Scorers and creators');
  await expect(page.locator('.football-inspector > strong')).toHaveText('Lionel Messi');
  await page.getByLabel('Search players', { exact: true }).fill('haaland');
  await page.getByLabel('Inspect player', { exact: true }).selectOption({ label: 'Erling Haaland' });
  await expect(page.locator('.football-inspector > strong')).toHaveText('Erling Haaland');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'CSV', exact: true }).click();
  const download = await downloadPromise;
  expect(await readFile((await download.path())!, 'utf8')).toContain('"Lionel Messi"');
  await page.getByLabel('Search players', { exact: true }).fill('');
  await page.getByLabel('Season', { exact: true }).selectOption('2025');
  await expect(page.getByLabel('Minimum minutes', { exact: true })).toHaveValue('900');
  await page.getByLabel('League', { exact: true }).selectOption('GB1');
  await page.getByRole('link', { name: 'Sources & method', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'What this chart compares' })).toBeInViewport();
  await page.getByRole('button', { name: 'ES', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Goleadores y creadores');
});

for (const width of [1440, 390]) for (const theme of ['light', 'dark']) {
  test(`football accessibility at ${width}px in ${theme} theme`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/?lang=en&theme=${theme}#football`);
    await expect(page.locator('.football-bubble').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `.impeccable/review/football-${width}-${theme}.png`, fullPage: true });
  });
}

test('football empty filters and failed downloads recover', async ({ page }) => {
  await page.goto('/?lang=en#football');
  await page.getByLabel('Season', { exact: true }).selectOption('2025');
  await page.getByLabel('Minimum minutes', { exact: true }).selectOption('18000');
  await expect(page.getByText('No players meet these filters.', { exact: false })).toBeVisible();
  await page.route('**/data/football.json', route => route.abort());
  await page.reload();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.unroute('**/data/football.json');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('.football-bubble').first()).toBeVisible();
});
