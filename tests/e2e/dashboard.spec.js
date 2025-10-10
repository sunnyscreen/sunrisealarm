const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Test Dashboard Page', () => {
  const dashboardUrl = 'file://' + path.join(__dirname, '../index.html');

  test.beforeEach(async ({ page }) => {
    // Navigate to the test dashboard
    await page.goto(dashboardUrl);
  });

  test('should load dashboard page with title', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle('Test Dashboard - Sunnyscreen');

    // Check main heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Test Dashboard');
  });

  test('should display stats cards', async ({ page }) => {
    // Check all four stats cards are present
    const statCards = page.locator('.stat-card');
    await expect(statCards).toHaveCount(4);

    // Check stat card labels
    await expect(page.locator('.stat-card h3').nth(0)).toHaveText('Total Tests');
    await expect(page.locator('.stat-card h3').nth(1)).toHaveText('Passed');
    await expect(page.locator('.stat-card h3').nth(2)).toHaveText('Failed');
    await expect(page.locator('.stat-card h3').nth(3)).toHaveText('Duration');

    // Check initial values are displayed
    await expect(page.locator('#total-tests')).toBeVisible();
    await expect(page.locator('#passed-tests')).toBeVisible();
    await expect(page.locator('#failed-tests')).toBeVisible();
    await expect(page.locator('#duration')).toBeVisible();
  });

  test('should have tabbed interface with three tabs', async ({ page }) => {
    // Check tabs container exists
    const tabsContainer = page.locator('.tabs-container');
    await expect(tabsContainer).toBeVisible();

    // Check all three tabs exist
    const tabs = page.locator('.tab');
    await expect(tabs).toHaveCount(3);

    // Check tab labels
    await expect(tabs.nth(0)).toHaveText('Unit Tests');
    await expect(tabs.nth(1)).toHaveText('Local End-to-End Tests');
    await expect(tabs.nth(2)).toHaveText('Post-Deployment End-to-End Tests');

    // Check Unit Tests tab is active by default
    await expect(tabs.nth(0)).toHaveClass(/active/);
  });

  test('should switch between tabs when clicked', async ({ page }) => {
    const unitTab = page.locator('.tab').nth(0);
    const e2eTab = page.locator('.tab').nth(1);
    const unitContent = page.locator('#unit-tab');
    const e2eContent = page.locator('#e2e-tab');

    // Initially, unit tab should be active
    await expect(unitTab).toHaveClass(/active/);
    await expect(unitContent).toHaveClass(/active/);
    await expect(e2eContent).not.toHaveClass(/active/);

    // Click E2E tab
    await e2eTab.click();

    // E2E tab should now be active
    await expect(e2eTab).toHaveClass(/active/);
    await expect(e2eContent).toHaveClass(/active/);
    await expect(unitContent).not.toHaveClass(/active/);

    // Click back to Unit Tests tab
    await unitTab.click();

    // Unit Tests tab should be active again
    await expect(unitTab).toHaveClass(/active/);
    await expect(unitContent).toHaveClass(/active/);
    await expect(e2eContent).not.toHaveClass(/active/);
  });

  test('should display Unit Tests tab content', async ({ page }) => {
    // Make sure we're on Unit Tests tab
    const unitTab = page.locator('.tab').nth(0);
    await unitTab.click();

    // Check tab title
    const tabTitle = page.locator('#unit-tab .tab-title');
    await expect(tabTitle).toHaveText('Unit Tests (Jest)');

    // Check "View Full Report" button exists
    const reportButton = page.locator('#unit-tab .btn-primary');
    await expect(reportButton).toBeVisible();
    await expect(reportButton).toHaveText('View Full Report');
    await expect(reportButton).toHaveAttribute('href', 'test-results/jest-report.html');

    // Check test results container exists
    const resultsContainer = page.locator('#jest-results');
    await expect(resultsContainer).toBeVisible();
  });

  test('should display Local E2E Tests tab content', async ({ page }) => {
    // Click Local E2E tab
    const e2eTab = page.locator('.tab').nth(1);
    await e2eTab.click();

    // Check tab title
    const tabTitle = page.locator('#e2e-tab .tab-title');
    await expect(tabTitle).toHaveText('Local End-to-End Tests (Playwright)');

    // Check "View Full Report" button exists
    const reportButton = page.locator('#e2e-tab .btn-primary');
    await expect(reportButton).toBeVisible();
    await expect(reportButton).toHaveText('View Full Report');
    await expect(reportButton).toHaveAttribute('href', 'test-results/playwright-report/index.html');

    // Check test results container exists
    const resultsContainer = page.locator('#playwright-results');
    await expect(resultsContainer).toBeVisible();

    // Check videos section exists in the DOM (may be empty if no videos)
    const videosSection = page.locator('#videos-section');
    const videosSectionCount = await videosSection.count();
    expect(videosSectionCount).toBe(1);
  });

  test('should display Post-Deployment E2E Tests tab content', async ({ page }) => {
    // Click Post-Deployment E2E tab
    const deployedTab = page.locator('.tab').nth(2);
    await deployedTab.click();

    // Check tab title
    const tabTitle = page.locator('#deployed-tab .tab-title');
    await expect(tabTitle).toHaveText('Post-Deployment End-to-End Tests (Playwright)');

    // Check "View Full Report" button exists
    const reportButton = page.locator('#deployed-tab .btn-primary');
    await expect(reportButton).toBeVisible();
    await expect(reportButton).toHaveText('View Full Report');
    await expect(reportButton).toHaveAttribute('href', 'test-results/playwright-deployed-report/index.html');

    // Check test results container exists
    const resultsContainer = page.locator('#playwright-deployed-results');
    await expect(resultsContainer).toBeVisible();

    // Check deployed videos section exists in the DOM (may be empty if no videos)
    const deployedVideosSection = page.locator('#deployed-videos-section');
    const deployedVideosSectionCount = await deployedVideosSection.count();
    expect(deployedVideosSectionCount).toBe(1);
  });

  test('should display timestamp', async ({ page }) => {
    const timestamp = page.locator('#last-updated');
    await expect(timestamp).toBeVisible();

    // Check timestamp contains "Last updated:"
    const timestampText = await timestamp.textContent();
    expect(timestampText).toContain('Last updated:');
  });

  test('should have proper styling and layout', async ({ page }) => {
    // Check gradient background exists
    const body = page.locator('body');
    const bgImage = await body.evaluate(el =>
      window.getComputedStyle(el).backgroundImage
    );
    expect(bgImage).toContain('linear-gradient');

    // Check stats grid uses grid layout
    const statsGrid = page.locator('.stats-grid');
    const display = await statsGrid.evaluate(el =>
      window.getComputedStyle(el).display
    );
    expect(display).toBe('grid');

    // Check tabs container has white background
    const tabsContainer = page.locator('.tabs-container');
    const bgColor = await tabsContainer.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toContain('rgb(255, 255, 255)'); // white
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Dashboard should still be visible and functional
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.stats-grid')).toBeVisible();
    await expect(page.locator('.tabs-container')).toBeVisible();

    // Tabs should still work
    const e2eTab = page.locator('.tab').nth(1);
    await e2eTab.click();
    await expect(e2eTab).toHaveClass(/active/);
  });

  test('should handle missing test results gracefully', async ({ page }) => {
    // Wait for page to load and attempt to fetch results
    await page.waitForTimeout(1000);

    // Since we're testing with a local file, fetch will likely fail
    // Check that error/no-data messages are shown
    const jestResults = page.locator('#jest-results');
    const jestText = await jestResults.textContent();

    // Should show either loading, error, or no-data message
    expect(
      jestText.includes('Loading') ||
      jestText.includes('No unit test results') ||
      jestText.includes('Failed to load')
    ).toBeTruthy();
  });
});
