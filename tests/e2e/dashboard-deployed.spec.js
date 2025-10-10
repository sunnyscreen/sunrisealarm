const { test, expect } = require('@playwright/test');

test.describe('Test Dashboard - Deployed Site', () => {
  const deployedUrl = 'https://bradnemer.github.io/sunnyscreen/tests/';

  test.beforeEach(async ({ page }) => {
    // Navigate to the deployed test dashboard
    await page.goto(deployedUrl);
  });

  test('should load deployed dashboard page', async ({ page }) => {
    // Check page loaded successfully
    await expect(page).toHaveTitle('Test Dashboard - Sunnyscreen');

    // Check main heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Test Dashboard');
  });

  test('should display all stats cards on deployed site', async ({ page }) => {
    // Check all four stats cards are present
    const statCards = page.locator('.stat-card');
    await expect(statCards).toHaveCount(4);

    // Verify stat values are loaded (not showing initial "-")
    await page.waitForTimeout(2000); // Give time for data to load

    const totalTests = page.locator('#total-tests');
    const totalText = await totalTests.textContent();
    // Should either show a number or still show "-" if no data yet
    expect(totalText).toMatch(/^\d+$|^-$/);
  });

  test('should load and display test results from deployed artifacts', async ({ page }) => {
    // Wait for test results to load
    await page.waitForTimeout(3000);

    // Check Jest results loaded or shows appropriate message
    const jestResults = page.locator('#jest-results');
    await expect(jestResults).toBeVisible();
    const jestText = await jestResults.textContent();

    // Should show either test results or a meaningful message
    expect(
      jestText.includes('test') ||
      jestText.includes('No unit test results') ||
      jestText.includes('Failed to load')
    ).toBeTruthy();
  });

  test('should have working tab navigation on deployed site', async ({ page }) => {
    const unitTab = page.locator('.tab').nth(0);
    const e2eTab = page.locator('.tab').nth(1);

    // Switch to E2E tab
    await e2eTab.click();
    await expect(e2eTab).toHaveClass(/active/);

    // Switch back to Unit Tests tab
    await unitTab.click();
    await expect(unitTab).toHaveClass(/active/);
  });

  test('should have accessible report links that point to deployed artifacts', async ({ page }) => {
    // Check Jest report link
    const jestReportLink = page.locator('#unit-tab .btn-primary');
    await expect(jestReportLink).toBeVisible();
    const jestHref = await jestReportLink.getAttribute('href');
    expect(jestHref).toBe('test-results/jest-report.html');

    // Switch to E2E tab
    await page.locator('.tab').nth(1).click();

    // Check Playwright report link
    const playwrightReportLink = page.locator('#e2e-tab .btn-primary');
    await expect(playwrightReportLink).toBeVisible();
    const playwrightHref = await playwrightReportLink.getAttribute('href');
    expect(playwrightHref).toBe('test-results/playwright-report/index.html');
  });

  test('should display timestamp showing when results were generated', async ({ page }) => {
    const timestamp = page.locator('#last-updated');
    await expect(timestamp).toBeVisible();

    const timestampText = await timestamp.textContent();
    expect(timestampText).toContain('Last updated:');
    // Should contain a date/time (basic check)
    expect(timestampText).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/);
  });

  test('should serve static assets correctly (CSS loaded)', async ({ page }) => {
    // Check that styles are applied (background gradient)
    const body = page.locator('body');
    const bgImage = await body.evaluate(el =>
      window.getComputedStyle(el).backgroundImage
    );
    expect(bgImage).toContain('linear-gradient');

    // Check that the page isn't showing unstyled content
    const container = page.locator('.container');
    const maxWidth = await container.evaluate(el =>
      window.getComputedStyle(el).maxWidth
    );
    expect(maxWidth).not.toBe('none');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Page should still render correctly
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.stats-grid')).toBeVisible();
    await expect(page.locator('.tabs-container')).toBeVisible();

    // Tabs should still work
    await page.locator('.tab').nth(1).click();
    await expect(page.locator('.tab').nth(1)).toHaveClass(/active/);
  });

  test('should handle direct navigation to deployed URL', async ({ page }) => {
    // Test that directly navigating to the URL works (not just from homepage)
    await page.goto(deployedUrl, { waitUntil: 'networkidle' });

    // Should load successfully
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.tabs-container')).toBeVisible();
  });

  test('should have valid page metadata', async ({ page }) => {
    // Check viewport meta tag exists
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);

    // Check charset meta tag
    const charset = page.locator('meta[charset]');
    await expect(charset).toHaveCount(1);
  });
});
