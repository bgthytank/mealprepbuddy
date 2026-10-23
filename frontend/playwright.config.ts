import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: '../test-results/school-lunch',
  timeout: 60000,
  expect: { timeout: 10000 },
  workers: 1,
  reporter: [
    ['list'],
    [
      'html',
      { outputFolder: '../test-results/school-lunch-report', open: 'never' },
    ],
  ],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    channel: 'chrome',
    headless: false,
    viewport: { width: 1440, height: 1000 },
    video: { mode: 'on', size: { width: 1440, height: 1000 } },
    screenshot: 'only-on-failure',
  },
});
