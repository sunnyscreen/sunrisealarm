const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for E2E testing
 * Tests the deployed web app functionality
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined, // 4 parallel workers in CI for faster execution
  timeout: process.env.CI ? 60000 : 30000, // 60s in CI, 30s locally
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }]
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on', // Always record videos (helpful for debugging)
    actionTimeout: 10000, // 10s timeout for individual actions
    // Add Vercel protection bypass header if provided
    extraHTTPHeaders: process.env.PLAYWRIGHT_BYPASS_HEADER && process.env.PLAYWRIGHT_BYPASS_VALUE ? {
      [process.env.PLAYWRIGHT_BYPASS_HEADER]: process.env.PLAYWRIGHT_BYPASS_VALUE
    } : {},
  },

  projects: process.env.CI ? [
    // In CI, only test with Chromium for speed
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ] : [
    // Locally, test all browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: process.env.CI ? undefined : {
    command: 'npm run test:dashboard',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
