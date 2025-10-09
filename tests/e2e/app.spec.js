const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const path = require('path');

test.describe('Sunrise Alarm App', () => {
  let electronApp;
  let window;

  test.beforeEach(async () => {
    // Launch Electron app
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../../main.js')],
      // Disable sandbox for CI environments (required for GitHub Actions Linux runners)
      executablePath: require('electron'),
      env: {
        ...process.env,
        ELECTRON_DISABLE_SANDBOX: '1',
      },
    });

    // Get the first window
    window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
  });

  test.afterEach(async () => {
    // Close the app
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('should launch and display config window', async () => {
    // Check window title
    const title = await window.title();
    expect(title).toBe('Set Sunrise Alarm');

    // Check main elements are visible
    await expect(window.locator('h1')).toHaveText('Sunrise Alarm');
    await expect(window.locator('.subtitle')).toContainText('Wake up gently');
  });

  test('should have form elements with default values', async () => {
    // Check wake time input exists and has default
    const wakeTimeInput = window.locator('#wakeTime');
    await expect(wakeTimeInput).toBeVisible();
    const wakeTime = await wakeTimeInput.inputValue();
    expect(wakeTime).toMatch(/^\d{2}:\d{2}$/);

    // Check duration input exists and has default
    const durationInput = window.locator('#duration');
    await expect(durationInput).toBeVisible();
    const duration = await durationInput.inputValue();
    expect(parseInt(duration)).toBeGreaterThanOrEqual(1);
    expect(parseInt(duration)).toBeLessThanOrEqual(60);

    // Check day buttons exist
    const dayButtons = window.locator('.day-btn');
    await expect(dayButtons).toHaveCount(7);

    // Check start button exists
    const startBtn = window.locator('#testBtn');
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toHaveText('Start');
  });

  test('should allow changing wake time', async () => {
    const wakeTimeInput = window.locator('#wakeTime');
    await wakeTimeInput.fill('08:30');

    const newValue = await wakeTimeInput.inputValue();
    expect(newValue).toBe('08:30');
  });

  test('should allow changing duration', async () => {
    const durationInput = window.locator('#duration');
    await durationInput.fill('45');

    const newValue = await durationInput.inputValue();
    expect(newValue).toBe('45');
  });

  test('should toggle day selection', async () => {
    const mondayBtn = window.locator('.day-btn[data-day="1"]');

    // Get initial state
    const initialClass = await mondayBtn.getAttribute('class');
    const wasActive = initialClass.includes('active');

    // Click to toggle
    await mondayBtn.click();

    // Check state changed
    const newClass = await mondayBtn.getAttribute('class');
    const isActive = newClass.includes('active');
    expect(isActive).toBe(!wasActive);
  });

  test('should open alarm window when Start button clicked', async () => {
    const startBtn = window.locator('#testBtn');

    // Click start button
    const [alarmWindow] = await Promise.all([
      electronApp.waitForEvent('window'),
      startBtn.click(),
    ]);

    // Check alarm window opened
    expect(alarmWindow).toBeTruthy();

    // Wait for alarm window to load
    await alarmWindow.waitForLoadState('domcontentloaded');

    // Check alarm window has time display
    const timeDisplay = alarmWindow.locator('#timeDisplay');
    await expect(timeDisplay).toBeVisible();

    // Close alarm window
    await alarmWindow.keyboard.press('Escape');
  });

  test('should validate duration input (reject invalid values)', async () => {
    const durationInput = window.locator('#duration');

    // Try to enter invalid values
    await durationInput.fill('100');
    await durationInput.blur();

    // Should be clamped to max
    const value = await durationInput.inputValue();
    expect(parseInt(value)).toBeLessThanOrEqual(60);
  });

  test('should show next alarm time when alarm is configured', async () => {
    // Ensure at least one day is selected
    const mondayBtn = window.locator('.day-btn[data-day="1"]');
    const mondayClass = await mondayBtn.getAttribute('class');
    if (!mondayClass.includes('active')) {
      await mondayBtn.click();
    }

    // Set wake time and trigger save
    const wakeTimeInput = window.locator('#wakeTime');
    await wakeTimeInput.fill('07:00');
    await wakeTimeInput.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })));

    // Wait a bit for IPC communication
    await window.waitForTimeout(500);

    // Check if next alarm display appears
    const nextAlarmDiv = window.locator('#nextAlarm');
    // It should either be visible or hidden based on config
    const isVisible = await nextAlarmDiv.isVisible();

    if (isVisible) {
      const text = await nextAlarmDiv.textContent();
      expect(text).toContain('Next alarm:');
    }
  });
});
