const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  // Exclude deployed tests from normal runs
  testIgnore: process.env.TEST_DEPLOYED ? undefined : '**/dashboard-deployed.spec.js',
  timeout: 30000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }]
  ],
  use: {
    trace: 'on-first-retry',
    video: 'on',
    screenshot: 'on',
  },
  outputDir: 'test-results/playwright-output',
});
