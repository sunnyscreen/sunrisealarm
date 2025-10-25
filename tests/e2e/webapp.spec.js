const { test, expect } = require('@playwright/test');

test.describe('Sunnyscreen Web App', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear localStorage before each test
    await context.clearCookies();
    await page.goto('/app.html');
    await page.evaluate(() => localStorage.clear());
  });

  test('should load the app with default configuration', async ({ page }) => {
    await page.goto('/app.html');

    // Check that main elements are present
    await expect(page.locator('h1')).toContainText('Sunrise Alarm');
    await expect(page.locator('.subtitle')).toContainText('Wake up gently');

    // Check default values
    const wakeTimeInput = page.locator('#wakeTime');
    const durationInput = page.locator('#duration');

    await expect(wakeTimeInput).toHaveValue('07:00');
    await expect(durationInput).toHaveValue('30');

    // Check default days (Mon-Fri should be active)
    const mondayBtn = page.locator('[data-day="1"]');
    const saturdayBtn = page.locator('[data-day="6"]');

    await expect(mondayBtn).toHaveClass(/active/);
    await expect(saturdayBtn).not.toHaveClass(/active/);
  });

  test('should update wake time', async ({ page }) => {
    await page.goto('/app.html');

    const wakeTimeInput = page.locator('#wakeTime');
    await wakeTimeInput.fill('08:30');
    await wakeTimeInput.blur();

    // Wait a bit for auto-save
    await page.waitForTimeout(500);

    // Reload page and verify persistence
    await page.reload();
    await expect(wakeTimeInput).toHaveValue('08:30');
  });

  test('should update duration', async ({ page }) => {
    await page.goto('/app.html');

    const durationInput = page.locator('#duration');
    await durationInput.fill('45');
    await durationInput.blur();

    // Wait for auto-save
    await page.waitForTimeout(500);

    // Reload and verify
    await page.reload();
    await expect(durationInput).toHaveValue('45');
  });

  test('should toggle day selection', async ({ page }) => {
    await page.goto('/app.html');

    const saturdayBtn = page.locator('[data-day="6"]');
    const mondayBtn = page.locator('[data-day="1"]');

    // Saturday should start inactive
    await expect(saturdayBtn).not.toHaveClass(/active/);

    // Click to activate
    await saturdayBtn.click();
    await expect(saturdayBtn).toHaveClass(/active/);

    // Click Monday to deactivate
    await mondayBtn.click();
    await expect(mondayBtn).not.toHaveClass(/active/);

    // Reload and verify persistence
    await page.reload();
    await expect(saturdayBtn).toHaveClass(/active/);
    await expect(mondayBtn).not.toHaveClass(/active/);
  });

  test('should display next alarm information', async ({ page }) => {
    await page.goto('/app.html');

    const nextAlarmDiv = page.locator('#nextAlarm');

    // Should be visible with default configuration
    await expect(nextAlarmDiv).toBeVisible();
    await expect(nextAlarmDiv).toContainText('Next alarm:');
    await expect(nextAlarmDiv).toContainText('Sunrise begins:');
  });

  test('should validate invalid wake time', async ({ page }) => {
    await page.goto('/app.html');

    const wakeTimeInput = page.locator('#wakeTime');

    // Try setting invalid time via JavaScript (since HTML5 input blocks some invalid values)
    await page.evaluate(() => {
      document.getElementById('wakeTime').value = '25:00';
      document.getElementById('wakeTime').dispatchEvent(new Event('change'));
    });

    await page.waitForTimeout(500);

    // Should revert to default
    await expect(wakeTimeInput).toHaveValue('07:00');
  });

  test('should validate invalid duration', async ({ page }) => {
    await page.goto('/app.html');

    const durationInput = page.locator('#duration');

    // Try setting invalid duration (0)
    await durationInput.fill('0');
    await durationInput.blur();

    await page.waitForTimeout(500);

    // Should revert to default
    await expect(durationInput).toHaveValue('30');

    // Try setting invalid duration (61)
    await durationInput.fill('61');
    await durationInput.blur();

    await page.waitForTimeout(500);

    // Should revert to default
    await expect(durationInput).toHaveValue('30');
  });

  test('should open power settings modal', async ({ page }) => {
    await page.goto('/app.html');

    const powerBtn = page.locator('#powerBtn');
    const modal = page.locator('#powerModal');

    // Modal should be hidden initially
    await expect(modal).not.toHaveClass(/show/);

    // Click power button
    await powerBtn.click();

    // Modal should be visible
    await expect(modal).toHaveClass(/show/);
    await expect(modal).toContainText('Power Management Settings');
    await expect(modal).toContainText('macOS');
    await expect(modal).toContainText('Windows');
    await expect(modal).toContainText('Linux');
  });

  test('should close power settings modal', async ({ page }) => {
    await page.goto('/app.html');

    const powerBtn = page.locator('#powerBtn');
    const modal = page.locator('#powerModal');
    const closeBtn = page.locator('.close-modal');

    // Open modal
    await powerBtn.click();
    await expect(modal).toHaveClass(/show/);

    // Close via button
    await closeBtn.click();
    await expect(modal).not.toHaveClass(/show/);
  });

  test('should start alarm test mode', async ({ page }) => {
    await page.goto('/app.html');

    const testBtn = page.locator('#testBtn');
    const alarmWindow = page.locator('#alarmWindow');

    // Start alarm
    await testBtn.click();

    // Wait for alarm to activate
    await page.waitForTimeout(500);

    // Alarm window should be visible
    await expect(page.locator('body')).toHaveClass(/alarm-active/);

    // Time display should be visible
    const timeDisplay = page.locator('#timeDisplay');
    await expect(timeDisplay).toBeVisible();

    // Should display current time in HH:MM format
    const timeText = await timeDisplay.textContent();
    expect(timeText).toMatch(/^\d{2}:\d{2}$/);
  });

  test('should stop alarm by clicking', async ({ page }) => {
    await page.goto('/app.html');

    const testBtn = page.locator('#testBtn');
    const alarmWindow = page.locator('#alarmWindow');

    // Start alarm
    await testBtn.click();
    await page.waitForTimeout(500);

    // Verify alarm is active
    await expect(page.locator('body')).toHaveClass(/alarm-active/);

    // Click to stop
    await alarmWindow.click();
    await page.waitForTimeout(500);

    // Alarm should be stopped
    await expect(page.locator('body')).not.toHaveClass(/alarm-active/);
  });

  test('should stop alarm with Escape key', async ({ page }) => {
    await page.goto('/app.html');

    const testBtn = page.locator('#testBtn');

    // Start alarm
    await testBtn.click();
    await page.waitForTimeout(500);

    // Verify alarm is active
    await expect(page.locator('body')).toHaveClass(/alarm-active/);

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Alarm should be stopped
    await expect(page.locator('body')).not.toHaveClass(/alarm-active/);
  });

  test('should calculate next alarm correctly', async ({ page }) => {
    await page.goto('/app.html');

    const wakeTimeInput = page.locator('#wakeTime');
    const nextAlarmDiv = page.locator('#nextAlarm');

    // Set wake time to 09:00
    await wakeTimeInput.fill('09:00');
    await wakeTimeInput.blur();
    await page.waitForTimeout(500);

    // Check that next alarm is displayed and contains the wake time
    const nextAlarmText = await nextAlarmDiv.textContent();
    expect(nextAlarmText).toContain('Next alarm:');
    expect(nextAlarmText).toContain('9:00'); // Could be 9:00 AM or 09:00 depending on locale
  });

  test('should persist configuration across page reloads', async ({ page }) => {
    await page.goto('/app.html');

    // Set custom configuration
    await page.locator('#wakeTime').fill('06:30');
    await page.locator('#duration').fill('45');
    await page.locator('[data-day="0"]').click(); // Enable Sunday
    await page.locator('[data-day="1"]').click(); // Disable Monday

    await page.waitForTimeout(500);

    // Reload page
    await page.reload();

    // Verify all settings persisted
    await expect(page.locator('#wakeTime')).toHaveValue('06:30');
    await expect(page.locator('#duration')).toHaveValue('45');
    await expect(page.locator('[data-day="0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-day="1"]')).not.toHaveClass(/active/);
  });
});
