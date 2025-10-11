/**
 * Unit tests for alarm timing and scheduling
 * Validates that alarms wait until the correct time to start
 */

const {
  calculateNextAlarm,
  calculateSunriseStart
} = require('../alarm-utils');

describe('Alarm Timing and Scheduling', () => {
  describe('Sunrise start time calculation', () => {
    test('should start sunrise exactly [duration] minutes before wake time', () => {
      // Test case: 7:00 AM wake time, 30 minute duration
      const wakeTime = '07:00';
      const duration = 30;
      const daysOfWeek = [1, 2, 3, 4, 5];
      const currentDate = new Date('2024-10-07T06:00:00'); // Monday 6 AM

      const alarmTime = calculateNextAlarm(wakeTime, daysOfWeek, currentDate);
      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      // Sunrise should start at 6:30 AM (30 min before 7:00 AM)
      expect(sunriseStart.getHours()).toBe(6);
      expect(sunriseStart.getMinutes()).toBe(30);

      // Verify the time difference is exactly the duration
      const diffMinutes = (alarmTime - sunriseStart) / (60 * 1000);
      expect(diffMinutes).toBe(duration);
    });

    test('should handle 1 minute duration correctly', () => {
      const wakeTime = '08:00';
      const duration = 1;
      const currentDate = new Date('2024-10-07T07:00:00');

      const alarmTime = calculateNextAlarm(wakeTime, [1, 2, 3, 4, 5], currentDate);
      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      // Should start at 7:59 AM
      expect(sunriseStart.getHours()).toBe(7);
      expect(sunriseStart.getMinutes()).toBe(59);

      const diffMinutes = (alarmTime - sunriseStart) / (60 * 1000);
      expect(diffMinutes).toBe(1);
    });

    test('should handle 60 minute duration correctly', () => {
      const wakeTime = '08:00';
      const duration = 60;
      const currentDate = new Date('2024-10-07T06:00:00');

      const alarmTime = calculateNextAlarm(wakeTime, [1, 2, 3, 4, 5], currentDate);
      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      // Should start at 7:00 AM (1 hour before)
      expect(sunriseStart.getHours()).toBe(7);
      expect(sunriseStart.getMinutes()).toBe(0);

      const diffMinutes = (alarmTime - sunriseStart) / (60 * 1000);
      expect(diffMinutes).toBe(60);
    });

    test('should handle sunrise starting before midnight', () => {
      // Wake time at 12:15 AM, 30 minute duration means sunrise starts at 11:45 PM previous day
      const wakeTime = '00:15';
      const duration = 30;
      const currentDate = new Date('2024-10-07T23:00:00'); // 11 PM

      const alarmTime = calculateNextAlarm(wakeTime, [0, 1, 2, 3, 4, 5, 6], currentDate);
      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      // Verify sunrise starts 30 minutes before alarm
      const diffMinutes = (alarmTime - sunriseStart) / (60 * 1000);
      expect(diffMinutes).toBe(30);

      // Sunrise should be on previous day
      expect(sunriseStart.getDate()).toBe(alarmTime.getDate() - 1);
      expect(sunriseStart.getHours()).toBe(23);
      expect(sunriseStart.getMinutes()).toBe(45);
    });
  });

  describe('Alarm scheduling delay calculation', () => {
    test('should calculate correct delay for alarm later today', () => {
      // Current time: 6:00 AM, Wake time: 7:00 AM, Duration: 30 min
      const currentDate = new Date('2024-10-07T06:00:00');
      const wakeTime = '07:00';
      const duration = 30;
      const daysOfWeek = [1, 2, 3, 4, 5]; // Monday

      const alarmTime = calculateNextAlarm(wakeTime, daysOfWeek, currentDate);
      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      const msUntilSunrise = sunriseStart - currentDate;
      const minutesUntilSunrise = msUntilSunrise / (60 * 1000);

      // Should wait 30 minutes (from 6:00 to 6:30)
      expect(minutesUntilSunrise).toBe(30);
    });

    test('should calculate correct delay for alarm tomorrow', () => {
      // Current time: 8:00 AM (after wake time), Wake time: 7:00 AM tomorrow
      const currentDate = new Date('2024-10-07T08:00:00'); // Monday 8 AM
      const wakeTime = '07:00';
      const duration = 30;
      const daysOfWeek = [1, 2, 3, 4, 5]; // Mon-Fri

      const alarmTime = calculateNextAlarm(wakeTime, daysOfWeek, currentDate);
      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      const msUntilSunrise = sunriseStart - currentDate;
      const hoursUntilSunrise = msUntilSunrise / (60 * 60 * 1000);

      // Should wait until 6:30 AM tomorrow (22.5 hours)
      expect(hoursUntilSunrise).toBe(22.5);

      // Verify it's scheduled for tomorrow
      expect(alarmTime.getDate()).toBe(currentDate.getDate() + 1);
    });

    test('should calculate correct delay when alarm is in near future', () => {
      // Current: 6:55 AM, Wake: 7:00 AM, Duration: 30 min
      // Even though sunrise start (6:30) is in the past, the alarm time (7:00) hasn't passed
      // so it should schedule for today
      const currentDate = new Date('2024-10-07T06:55:00');
      const wakeTime = '07:00';
      const duration = 30;
      const daysOfWeek = [1, 2, 3, 4, 5];

      const alarmTime = calculateNextAlarm(wakeTime, daysOfWeek, currentDate);
      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      // Alarm should be scheduled for today (wake time hasn't passed)
      expect(alarmTime.getDate()).toBe(currentDate.getDate());
      expect(alarmTime.getHours()).toBe(7);
      expect(alarmTime.getMinutes()).toBe(0);

      // Sunrise start will be 6:30, which is in the past
      expect(sunriseStart.getHours()).toBe(6);
      expect(sunriseStart.getMinutes()).toBe(30);

      // Note: In the actual app, this would mean the alarm starts immediately
      // since the calculated sunrise start time has already passed
      const msUntilSunrise = sunriseStart - currentDate;
      expect(msUntilSunrise).toBeLessThan(0); // Sunrise time is in the past
    });

    test('should handle scheduling across weekend', () => {
      // Friday 8 PM, weekday-only alarm
      const currentDate = new Date('2024-10-11T20:00:00'); // Friday 8 PM
      const wakeTime = '07:00';
      const duration = 30;
      const daysOfWeek = [1, 2, 3, 4, 5]; // Mon-Fri only

      const alarmTime = calculateNextAlarm(wakeTime, daysOfWeek, currentDate);
      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      // Should schedule for Monday 6:30 AM
      expect(alarmTime.getDay()).toBe(1); // Monday
      expect(sunriseStart.getHours()).toBe(6);
      expect(sunriseStart.getMinutes()).toBe(30);

      const hoursUntilSunrise = (sunriseStart - currentDate) / (60 * 60 * 1000);
      expect(hoursUntilSunrise).toBeCloseTo(58.5, 1); // ~58.5 hours (Fri 8PM to Mon 6:30AM)
    });
  });

  describe('Edge cases for timing', () => {
    test('should not start alarm before sunrise start time', () => {
      const currentDate = new Date('2024-10-07T06:00:00');
      const wakeTime = '07:00';
      const duration = 30;
      const daysOfWeek = [1, 2, 3, 4, 5];

      const alarmTime = calculateNextAlarm(wakeTime, daysOfWeek, currentDate);
      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      // Sunrise start must be in the future
      expect(sunriseStart.getTime()).toBeGreaterThan(currentDate.getTime());
    });

    test('should maintain exact duration between sunrise and alarm', () => {
      // Test multiple scenarios
      const scenarios = [
        { wakeTime: '06:00', duration: 15 },
        { wakeTime: '09:30', duration: 45 },
        { wakeTime: '12:00', duration: 60 },
        { wakeTime: '23:30', duration: 20 }
      ];

      scenarios.forEach(({ wakeTime, duration }) => {
        const currentDate = new Date('2024-10-07T00:00:00');
        const alarmTime = calculateNextAlarm(wakeTime, [1, 2, 3, 4, 5, 6, 0], currentDate);
        const sunriseStart = calculateSunriseStart(alarmTime, duration);

        const actualDuration = (alarmTime - sunriseStart) / (60 * 1000);
        expect(actualDuration).toBe(duration);
      });
    });

    test('should handle very short duration (1 minute)', () => {
      const currentDate = new Date('2024-10-07T06:58:00');
      const wakeTime = '07:00';
      const duration = 1;
      const daysOfWeek = [1, 2, 3, 4, 5];

      const alarmTime = calculateNextAlarm(wakeTime, daysOfWeek, currentDate);
      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      // Should start at 6:59
      expect(sunriseStart.getHours()).toBe(6);
      expect(sunriseStart.getMinutes()).toBe(59);

      const msUntilSunrise = sunriseStart - currentDate;
      const minutesUntilSunrise = msUntilSunrise / (60 * 1000);
      expect(minutesUntilSunrise).toBe(1);
    });

    test('should handle maximum duration (60 minutes)', () => {
      const currentDate = new Date('2024-10-07T06:00:00');
      const wakeTime = '08:00';
      const duration = 60;
      const daysOfWeek = [1, 2, 3, 4, 5];

      const alarmTime = calculateNextAlarm(wakeTime, daysOfWeek, currentDate);
      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      // Should start at 7:00
      expect(sunriseStart.getHours()).toBe(7);
      expect(sunriseStart.getMinutes()).toBe(0);

      const hoursUntilSunrise = (sunriseStart - currentDate) / (60 * 60 * 1000);
      expect(hoursUntilSunrise).toBe(1);
    });
  });

  describe('Precision and accuracy', () => {
    test('should calculate timing with millisecond precision', () => {
      const wakeTime = '07:00';
      const duration = 30;
      const currentDate = new Date('2024-10-07T06:00:00.000');

      const alarmTime = calculateNextAlarm(wakeTime, [1, 2, 3, 4, 5], currentDate);
      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      const diffMs = alarmTime - sunriseStart;
      const expectedMs = duration * 60 * 1000;

      expect(diffMs).toBe(expectedMs);
    });

    test('should not drift due to repeated calculations', () => {
      const wakeTime = '07:00';
      const duration = 30;
      const daysOfWeek = [1, 2, 3, 4, 5];

      // Calculate multiple times
      const results = [];
      for (let i = 0; i < 10; i++) {
        const currentDate = new Date('2024-10-07T06:00:00');
        const alarmTime = calculateNextAlarm(wakeTime, daysOfWeek, currentDate);
        const sunriseStart = calculateSunriseStart(alarmTime, duration);
        results.push(sunriseStart.getTime());
      }

      // All calculations should be identical
      const allSame = results.every(time => time === results[0]);
      expect(allSame).toBe(true);
    });
  });
});
