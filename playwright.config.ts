import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  use: { baseURL: process.env.TEST_BASE_URL ?? 'http://127.0.0.1:4174', browserName: 'chromium', reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } },
  webServer: process.env.TEST_BASE_URL ? undefined : { command: 'npm run preview -- --host 127.0.0.1 --port 4174 --strictPort', url: 'http://127.0.0.1:4174', reuseExistingServer: !process.env.CI },
});
