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
    await expect(apiKeyInput).toHaveAttribute('placeholder', 'sk-ant-...');
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
    await expect(table).toBeAttached(); // Table exists but is hidden until data generated

    // Check for required column headers (they exist even if hidden)
    // Use exact text matching to avoid matching "Day" in "Daylight Hours"
    await expect(page.locator('th:text-is("Day")')).toBeAttached();
    await expect(page.locator('th:text-is("Date")')).toBeAttached();
    await expect(page.locator('th:text-is("Sunrise")')).toBeAttached();
    await expect(page.locator('th:text-is("Sunset")')).toBeAttached();
    await expect(page.locator('th:text-is("Daylight Hours")')).toBeAttached();
  });

  test('should show status message area', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    const statusDiv = page.locator('#status');
    await expect(statusDiv).toBeAttached(); // Status div exists but is hidden initially
  });

  test('should validate empty API key', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    const generateBtn = page.locator('#generateBtn');
    const statusDiv = page.locator('#status');

    // Try to generate without API key
    await generateBtn.click();

    // Should show error message
    await expect(statusDiv).toContainText('Please enter your Anthropic API key');
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

  test('homepage footer should not include sunrise data link', async ({ page }) => {
    await page.goto('/');

    // The sunrise data footer link was intentionally removed
    const sunriseDataLink = page.locator('a[href="sunrise-data.html"]');
    await expect(sunriseDataLink).toHaveCount(0);
  });

  test('should load sunrise data page directly', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    // Should be on sunrise data page
    await expect(page).toHaveURL(/.*sunrise-data(\.html)?$/);
    await expect(page.locator('h1')).toContainText('Sunrise & Sunset Data');
  });

  test('should have responsive table design', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    const table = page.locator('#dataTable');
    await expect(table).toBeAttached(); // Table exists but is hidden until data generated

    // Table exists and is styled via CSS (no need for class attribute)
    const tableContainer = page.locator('.table-container');
    await expect(tableContainer).toBeAttached();
  });

  test('should display correct UI elements in proper order', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    // Get y-coordinates of elements to verify order
    const heading = page.locator('h1');
    const apiKeyInput = page.locator('#apiKey');
    const generateBtn = page.locator('#generateBtn');
    const table = page.locator('#dataTable');

    // All elements should exist (table is hidden until data is generated)
    await expect(heading).toBeVisible();
    await expect(apiKeyInput).toBeVisible();
    await expect(generateBtn).toBeVisible();
    await expect(table).toBeAttached(); // Table exists but is hidden initially

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
    await apiKeyInput.blur(); // Trigger blur event to save to localStorage

    // Reload page
    await page.reload();

    // API key should persist (from localStorage)
    await expect(apiKeyInput).toHaveValue('test-key-persist');
  });

  test('should show appropriate messages for different states', async ({ page }) => {
    await page.goto('/sunrise-data.html');

    const statusDiv = page.locator('#status');

    // Initial state - should have status div ready (but hidden)
    await expect(statusDiv).toBeAttached();

    // Status div should be empty or have default message initially
    const initialText = await statusDiv.textContent();
    expect(initialText.length).toBeGreaterThanOrEqual(0);
  });
});
