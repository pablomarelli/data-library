import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('desktop sidebar groups analyses and marks the active route', async ({ page }) => {
  await page.goto('/?lang=en&theme=light#salary');
  const nav = page.getByRole('navigation', { name: 'Explore charts' });
  await expect(nav.getByRole('heading', { name: 'Economy' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Average salary', exact: true })).toHaveAttribute('aria-current', 'page');
  const sidebar = (await page.locator('.sidebar').boundingBox())!;
  const main = (await page.locator('main').boundingBox())!;
  expect(sidebar.x + sidebar.width).toBeLessThan(main.x);
  await page.getByRole('button', { name: '3 years', exact: true }).click();
  await nav.getByRole('link', { name: 'Porcel Jr.', exact: true }).click();
  await expect(nav.getByRole('link', { name: 'Porcel Jr.', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByLabel('From', { exact: true })).toHaveValue('2012-10');
  await nav.getByRole('link', { name: 'Data library', exact: true }).click();
  await expect(nav.getByRole('link', { name: 'Data library', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.goBack();
  await expect(nav.getByRole('link', { name: 'Porcel Jr.', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('mobile sidebar supports keyboard, closes on navigation, and translates sections', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto('/?lang=es&theme=dark#salary');
  const toggle = page.getByRole('button', { name: /Explorar gráficos/ });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('navigation', { name: 'Explorar gráficos' })).toBeHidden();
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Economía', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Porcel Jr.', exact: true }).focus();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.screenshot({ path: '.impeccable/review/sidebar-mobile-open.png', fullPage: true });
  await page.getByRole('link', { name: 'Porcel Jr.', exact: true }).click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('salario digno');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.getByRole('button', { name: /Explore charts/ }).click();
  await expect(page.getByRole('heading', { name: 'Economy', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('sidebar layout stays within intermediate widths', async ({ page }) => {
  for (const width of [901, 1024, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/?lang=en&asado=1#salary');
    await expect(page.getByTestId('axis-asadoKg')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
