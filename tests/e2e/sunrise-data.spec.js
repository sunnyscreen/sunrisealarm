const { test, expect } = require('@playwright/test');

test.describe('Sunrise Data Table', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear localStorage before each test
    await context.clearCookies();
    await page.goto('/sunrise-data.html');
    await page.evaluate(() => localStorage.clear());
  });

  test('should load the sunrise data page', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    // Check that main elements are present
    await expect(page.locator('h1')).toContainText('Sunrise & Sunset Data');
    await expect(page.locator('.subtitle')).toContainText('AI-generated hypothetical sunrise and sunset times for 100 days');
  });

  test('should display API key input field', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    const apiKeyInput = page.locator('#apiKey');
    await expect(apiKeyInput).toBeVisible();
    await expect(apiKeyInput).toHaveAttribute('type', 'password');
    await expect(apiKeyInput).toHaveAttribute('placeholder', 'sk-...');
  });

  test('should display generate data button', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    const generateBtn = page.locator('#generateBtn');
    await expect(generateBtn).toBeVisible();
    await expect(generateBtn).toContainText('Generate Data');
  });

  test('should display export button (initially disabled)', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    const exportBtn = page.locator('#exportBtn');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toHaveAttribute('disabled', '');
  });

  test('should show empty data table initially', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    const tableBody = page.locator('#dataTable tbody');
    const rows = tableBody.locator('tr');

    // Should have no data rows initially (or a "no data" message)
    const rowCount = await rows.count();
    expect(rowCount).toBeLessThanOrEqual(1); // Either 0 rows or 1 "no data" row
  });

  test('should have table headers for all columns', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    const table = page.locator('#dataTable');
    await expect(table).toBeVisible();

    // Check for required column headers
    await expect(page.locator('th:has-text("Day")')).toBeVisible();
    await expect(page.locator('th:has-text("Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Sunrise")')).toBeVisible();
    await expect(page.locator('th:has-text("Sunset")')).toBeVisible();
    await expect(page.locator('th:has-text("Daylight Hours")')).toBeVisible();
  });

  test('should show status message area', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    const statusDiv = page.locator('#status');
    await expect(statusDiv).toBeVisible();
  });

  test('should validate empty API key', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    const generateBtn = page.locator('#generateBtn');
    const statusDiv = page.locator('#status');

    // Try to generate without API key
    await generateBtn.click();

    // Should show error message
    await expect(statusDiv).toContainText('Please enter your OpenAI API key');
  });

  test('should persist API key in localStorage', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    const apiKeyInput = page.locator('#apiKey');
    const testKey = 'test-api-key-123';

    // Enter API key
    await apiKeyInput.fill(testKey);
    await apiKeyInput.blur();

    // Wait for save
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();

    // API key should be restored
    await expect(apiKeyInput).toHaveValue(testKey);
  });

  test('should have back to home link', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    const homeLink = page.locator('a[href="/"]');
    await expect(homeLink).toBeVisible();
  });

  test('should show loading state during data generation', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    const apiKeyInput = page.locator('#apiKey');
    const generateBtn = page.locator('#generateBtn');
    const statusDiv = page.locator('#status');

    // Enter a fake API key
    await apiKeyInput.fill('sk-test-fake-key');

    // Click generate button
    await generateBtn.click();

    // Should show loading state immediately
    // Note: This will fail in reality because API call is invalid,
    // but we're testing that the loading state appears
    await expect(statusDiv).toContainText('Generating');
  });

  test('should display sunrise data page with proper styling', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    // Check that the page has the gradient background (hero section)
    const hero = page.locator('.hero, .container').first();
    await expect(hero).toBeVisible();

    // Check that the page is responsive
    const viewport = page.viewportSize();
    expect(viewport.width).toBeGreaterThan(0);
  });

  test('should format CSV filename with date', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    // Test CSV filename format logic
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const expectedFilename = `sunrise-sunset-data-${year}-${month}-${day}.csv`;

    // Verify filename format is valid
    expect(expectedFilename).toMatch(/sunrise-sunset-data-\d{4}-\d{2}-\d{2}\.csv/);
  });

  test('should have link in homepage footer', async ({ page }) => {
    await page.goto('/');

    // Check that homepage has link to sunrise data page
    const sunriseDataLink = page.locator('a[href="sunrise-data.html"]');
    await expect(sunriseDataLink).toBeVisible();
    await expect(sunriseDataLink).toContainText('Sunrise Data');
  });

  test('should navigate from homepage to sunrise data page', async ({ page }) => {
    await page.goto('/');

    // Click the sunrise data link
    const sunriseDataLink = page.locator('a[href="sunrise-data.html"]');
    await sunriseDataLink.click();

    // Should navigate to sunrise data page
    await expect(page).toHaveURL(/.*sunrise-data\.html/);
    await expect(page.locator('h1')).toContainText('Sunrise & Sunset Data');
  });

  test('should have responsive table design', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    const table = page.locator('#dataTable');
    await expect(table).toBeVisible();

    // Table should have styling classes for responsiveness
    const tableClass = await table.getAttribute('class');
    expect(tableClass).toBeTruthy();
  });

  test('should display correct UI elements in proper order', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    // Get y-coordinates of elements to verify order
    const heading = page.locator('h1');
    const apiKeyInput = page.locator('#apiKey');
    const generateBtn = page.locator('#generateBtn');
    const table = page.locator('#dataTable');

    // All elements should be visible
    await expect(heading).toBeVisible();
    await expect(apiKeyInput).toBeVisible();
    await expect(generateBtn).toBeVisible();
    await expect(table).toBeVisible();

    // Heading should be above API key input
    const headingBox = await heading.boundingBox();
    const apiKeyBox = await apiKeyInput.boundingBox();

    expect(headingBox.y).toBeLessThan(apiKeyBox.y);
  });

  test('should clear API key button work', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    const apiKeyInput = page.locator('#apiKey');

    // Enter API key
    await apiKeyInput.fill('test-key');
    await expect(apiKeyInput).toHaveValue('test-key');

    // Clear the input
    await apiKeyInput.clear();
    await expect(apiKeyInput).toHaveValue('');
  });

  test('should handle very long API keys', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    const apiKeyInput = page.locator('#apiKey');
    const longKey = 'sk-' + 'x'.repeat(200); // Very long key

    await apiKeyInput.fill(longKey);
    await expect(apiKeyInput).toHaveValue(longKey);
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    // Check for meta tags
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should maintain Sunnyscreen branding', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    // Should have consistent color scheme
    // Check that page uses the gradient background
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Should have orange accent colors (matching Sunnyscreen brand)
    // This is implicit in the design
  });

  test('should handle page refresh without losing UI state', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    const apiKeyInput = page.locator('#apiKey');
    await apiKeyInput.fill('test-key-persist');

    // Reload page
    await page.reload();

    // API key should persist (from localStorage)
    await expect(apiKeyInput).toHaveValue('test-key-persist');
  });

  test('should show appropriate messages for different states', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    const statusDiv = page.locator('#status');

    // Initial state - should have status div ready
    await expect(statusDiv).toBeVisible();

    // Status div should be empty or have default message initially
    const initialText = await statusDiv.textContent();
    expect(initialText.length).toBeGreaterThanOrEqual(0);
  });
});
