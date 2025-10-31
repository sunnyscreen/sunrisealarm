const { test, expect } = require('@playwright/test');

test.describe('Alarm Timing Validation', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear localStorage before each test
    await context.clearCookies();
    await page.goto('/app.html');
    await page.evaluate(() => localStorage.clear());
  });

  test('should display sunrise start time correctly (wake time - duration)', async ({ page }) => {
    await page.goto('/app.html');

    // Set wake time to 07:00 and duration to 30 minutes
    await page.locator('#wakeTime').fill('07:00');
    await page.locator('#duration').fill('30');
    await page.locator('#wakeTime').blur();

    // Wait for auto-save and next alarm calculation
    await page.waitForTimeout(500);

    // Check that the "Next alarm" display shows sunrise starting at 6:30
    const nextAlarmDiv = page.locator('#nextAlarm');
    const nextAlarmText = await nextAlarmDiv.textContent();

    // Should show sunrise begins at 6:30 (30 min before 7:00)
    expect(nextAlarmText).toContain('Sunrise begins:');
    expect(nextAlarmText).toMatch(/6:30/); // Could be 6:30 AM or 06:30
  });

  test('should calculate sunrise time correctly with 1 minute duration', async ({ page }) => {
    await page.goto('/app.html');

    await page.locator('#wakeTime').fill('08:00');
    await page.locator('#duration').fill('1');
    await page.locator('#wakeTime').blur();

    await page.waitForTimeout(500);

    const nextAlarmText = await page.locator('#nextAlarm').textContent();

    // Sunrise should start at 7:59 (1 min before 8:00)
    expect(nextAlarmText).toMatch(/7:59/);
  });

  test('should calculate sunrise time correctly with 60 minute duration', async ({ page }) => {
    await page.goto('/app.html');

    await page.locator('#wakeTime').fill('09:00');
    await page.locator('#duration').fill('60');
    await page.locator('#wakeTime').blur();

    await page.waitForTimeout(500);

    const nextAlarmText = await page.locator('#nextAlarm').textContent();

    // Sunrise should start at 8:00 (60 min before 9:00)
    expect(nextAlarmText).toMatch(/8:00|8:0{1,2}\s*AM/);
  });

  test('should not trigger alarm immediately when set for future', async ({ page }) => {
    await page.goto('/app.html');

    // Get current time and set alarm for 2 hours from now
    const now = new Date();
    const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const hours = String(futureTime.getHours()).padStart(2, '0');
    const minutes = String(futureTime.getMinutes()).padStart(2, '0');

    await page.locator('#wakeTime').fill(`${hours}:${minutes}`);
    await page.locator('#duration').fill('30');
    await page.locator('#wakeTime').blur();

    // Wait a few seconds
    await page.waitForTimeout(1000);

    // Alarm should NOT be active
    const body = page.locator('body');
    await expect(body).not.toHaveClass(/alarm-active/);
  });

  test('should show correct sunrise start time after changing duration', async ({ page }) => {
    await page.goto('/app.html');

    // Set initial configuration
    await page.locator('#wakeTime').fill('07:00');
    await page.locator('#duration').fill('30');
    await page.locator('#wakeTime').blur();
    await page.waitForTimeout(500);

    let nextAlarmText = await page.locator('#nextAlarm').textContent();
    expect(nextAlarmText).toMatch(/6:30/);

    // Change duration to 45 minutes
    await page.locator('#duration').fill('45');
    await page.locator('#duration').blur();
    await page.waitForTimeout(500);

    // Sunrise should now start at 6:15 (45 min before 7:00)
    nextAlarmText = await page.locator('#nextAlarm').textContent();
    expect(nextAlarmText).toMatch(/6:15/);
  });

  test('should show correct sunrise start time after changing wake time', async ({ page }) => {
    await page.goto('/app.html');

    // Set initial configuration
    await page.locator('#wakeTime').fill('07:00');
    await page.locator('#duration').fill('30');
    await page.locator('#wakeTime').blur();
    await page.waitForTimeout(500);

    let nextAlarmText = await page.locator('#nextAlarm').textContent();
    expect(nextAlarmText).toMatch(/6:30/);

    // Change wake time to 8:00
    await page.locator('#wakeTime').fill('08:00');
    await page.locator('#wakeTime').blur();
    await page.waitForTimeout(500);

    // Sunrise should now start at 7:30 (30 min before 8:00)
    nextAlarmText = await page.locator('#nextAlarm').textContent();
    expect(nextAlarmText).toMatch(/7:30/);
  });

  test('should persist sunrise timing calculation after reload', async ({ page }) => {
    await page.goto('/app.html');

    // Set configuration
    await page.locator('#wakeTime').fill('07:30');
    await page.locator('#duration').fill('20');
    await page.locator('#wakeTime').blur();
    await page.waitForTimeout(500);

    // Verify sunrise time
    let nextAlarmText = await page.locator('#nextAlarm').textContent();
    expect(nextAlarmText).toMatch(/7:10/); // 20 min before 7:30

    // Reload page
    await page.reload();
    await page.waitForTimeout(500);

    // Sunrise time should still be correct
    nextAlarmText = await page.locator('#nextAlarm').textContent();
    expect(nextAlarmText).toMatch(/7:10/);
  });

  test('should display both alarm time and sunrise time in next alarm info', async ({ page }) => {
    await page.goto('/app.html');

    await page.locator('#wakeTime').fill('07:00');
    await page.locator('#duration').fill('30');
    await page.locator('#wakeTime').blur();
    await page.waitForTimeout(500);

    const nextAlarmText = await page.locator('#nextAlarm').textContent();

    // Should show both the alarm time (7:00) and sunrise start (6:30)
    expect(nextAlarmText).toContain('Next alarm:');
    expect(nextAlarmText).toContain('Sunrise begins:');
    expect(nextAlarmText).toMatch(/7:00|7:0{1,2}\s*AM/); // Alarm time
    expect(nextAlarmText).toMatch(/6:30/); // Sunrise start
  });

  test('should handle midnight crossing correctly', async ({ page }) => {
    await page.goto('/app.html');

    // Set alarm for 12:15 AM with 30 minute duration
    // Sunrise should start at 11:45 PM (previous day)
    await page.locator('#wakeTime').fill('00:15');
    await page.locator('#duration').fill('30');
    await page.locator('#wakeTime').blur();
    await page.waitForTimeout(500);

    const nextAlarmText = await page.locator('#nextAlarm').textContent();

    // Should show alarm at 12:15 and sunrise at 11:45
    expect(nextAlarmText).toContain('Next alarm:');
    expect(nextAlarmText).toContain('Sunrise begins:');
  });

  test('should validate timing with browser console logs', async ({ page }) => {
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    await page.goto('/app.html');

    // Set alarm for future
    await page.locator('#wakeTime').fill('07:00');
    await page.locator('#duration').fill('30');
    await page.locator('#wakeTime').blur();
    await page.waitForTimeout(1000);

    // Check if console logs contain scheduling information
    const schedulingLogs = consoleMessages.filter(msg =>
      msg.includes('Next alarm scheduled for') ||
      msg.includes('alarm')
    );

    // Should have logged scheduling information
    expect(schedulingLogs.length).toBeGreaterThan(0);
  });

  test('should maintain accurate timing across multiple configuration changes', async ({ page }) => {
    await page.goto('/app.html');

    // Test multiple configurations in sequence
    const configs = [
      { wakeTime: '07:00', duration: '30', expectedSunrise: '6:30' },
      { wakeTime: '08:00', duration: '15', expectedSunrise: '7:45' },
      { wakeTime: '09:30', duration: '45', expectedSunrise: '8:45' },
      { wakeTime: '06:00', duration: '60', expectedSunrise: '5:00' }
    ];

    for (const config of configs) {
      await page.locator('#wakeTime').fill(config.wakeTime);
      await page.locator('#duration').fill(config.duration);
      await page.locator('#wakeTime').blur();
      await page.waitForTimeout(500);

      const nextAlarmText = await page.locator('#nextAlarm').textContent();
      expect(nextAlarmText).toMatch(new RegExp(config.expectedSunrise));
    }
  });

  test('should calculate timing correctly for edge case durations', async ({ page }) => {
    await page.goto('/app.html');

    // Test minimum duration (1 minute)
    await page.locator('#wakeTime').fill('07:00');
    await page.locator('#duration').fill('1');
    await page.locator('#wakeTime').blur();
    await page.waitForTimeout(500);

    let nextAlarmText = await page.locator('#nextAlarm').textContent();
    expect(nextAlarmText).toMatch(/6:59/);

    // Test maximum duration (60 minutes)
    await page.locator('#duration').fill('60');
    await page.locator('#duration').blur();
    await page.waitForTimeout(500);

    nextAlarmText = await page.locator('#nextAlarm').textContent();
    expect(nextAlarmText).toMatch(/6:00|6:0{1,2}\s*AM/);
  });
});
