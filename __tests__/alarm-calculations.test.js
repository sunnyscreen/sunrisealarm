/**
 * Unit tests for alarm and sunrise calculations
 */

const {
  calculateNextAlarm,
  calculateSunriseStart,
  isValidTimeFormat,
  isValidDuration,
  getDefaultConfig,
  validateAndFixConfig
} = require('../alarm-utils');

describe('Alarm Calculations', () => {
  describe('Next alarm time calculation', () => {
    test('should schedule alarm for today if time has not passed', () => {
      // 6:00 AM, alarm set for 7:00 AM (same day)
      const currentDate = new Date('2024-10-07T06:00:00');
      const wakeTime = '07:00';

      const nextAlarm = calculateNextAlarm(wakeTime, currentDate);

      expect(nextAlarm.getDate()).toBe(7); // Same day
      expect(nextAlarm.getHours()).toBe(7);
      expect(nextAlarm.getMinutes()).toBe(0);
    });

    test('should schedule alarm for tomorrow if time has passed today', () => {
      // 8:00 AM, alarm set for 7:00 AM (next day)
      const currentDate = new Date('2024-10-07T08:00:00');
      const wakeTime = '07:00';

      const nextAlarm = calculateNextAlarm(wakeTime, currentDate);

      expect(nextAlarm.getDate()).toBe(8); // Next day
      expect(nextAlarm.getHours()).toBe(7);
      expect(nextAlarm.getMinutes()).toBe(0);
    });

    test('should handle midnight alarm time', () => {
      // 11:00 PM, alarm for midnight (next day)
      const currentDate = new Date('2024-10-07T23:00:00');
      const wakeTime = '00:00';

      const nextAlarm = calculateNextAlarm(wakeTime, currentDate);

      expect(nextAlarm.getDate()).toBe(8); // Next day
      expect(nextAlarm.getHours()).toBe(0);
      expect(nextAlarm.getMinutes()).toBe(0);
    });

    test('should handle late night alarm time', () => {
      // 10:00 PM, alarm for 11:30 PM (same day)
      const currentDate = new Date('2024-10-07T22:00:00');
      const wakeTime = '23:30';

      const nextAlarm = calculateNextAlarm(wakeTime, currentDate);

      expect(nextAlarm.getDate()).toBe(7); // Same day
      expect(nextAlarm.getHours()).toBe(23);
      expect(nextAlarm.getMinutes()).toBe(30);
    });

    test('should handle alarm time exactly at current time', () => {
      // 7:00 AM, alarm set for 7:00 AM (next day since time has passed)
      const currentDate = new Date('2024-10-07T07:00:00');
      const wakeTime = '07:00';

      const nextAlarm = calculateNextAlarm(wakeTime, currentDate);

      expect(nextAlarm.getDate()).toBe(8); // Next day (time has passed)
      expect(nextAlarm.getHours()).toBe(7);
      expect(nextAlarm.getMinutes()).toBe(0);
    });
  });

  describe('Sunrise start time calculation', () => {
    test('should calculate sunrise start 30 minutes before alarm', () => {
      const alarmTime = new Date('2024-10-07T07:00:00');
      const duration = 30;

      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      expect(sunriseStart.getHours()).toBe(6);
      expect(sunriseStart.getMinutes()).toBe(30);
    });

    test('should calculate sunrise start 1 minute before alarm', () => {
      const alarmTime = new Date('2024-10-07T07:00:00');
      const duration = 1;

      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      expect(sunriseStart.getHours()).toBe(6);
      expect(sunriseStart.getMinutes()).toBe(59);
    });

    test('should calculate sunrise start 60 minutes before alarm', () => {
      const alarmTime = new Date('2024-10-07T07:00:00');
      const duration = 60;

      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      expect(sunriseStart.getHours()).toBe(6);
      expect(sunriseStart.getMinutes()).toBe(0);
    });

    test('should handle sunrise start crossing midnight backwards', () => {
      // Alarm at 12:15 AM with 30 minute duration
      const alarmTime = new Date('2024-10-07T00:15:00');
      const duration = 30;

      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      expect(sunriseStart.getDate()).toBe(6); // Previous day
      expect(sunriseStart.getHours()).toBe(23);
      expect(sunriseStart.getMinutes()).toBe(45);
    });

    test('should handle sunrise start crossing hour boundary', () => {
      // Alarm at 8:10 AM with 15 minute duration
      const alarmTime = new Date('2024-10-07T08:10:00');
      const duration = 15;

      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      expect(sunriseStart.getHours()).toBe(7);
      expect(sunriseStart.getMinutes()).toBe(55);
    });

    test('should handle exact hour boundary', () => {
      // Alarm at 7:00 AM with 60 minute duration
      const alarmTime = new Date('2024-10-07T07:00:00');
      const duration = 60;

      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      expect(sunriseStart.getHours()).toBe(6);
      expect(sunriseStart.getMinutes()).toBe(0);
    });

    test('should preserve date when not crossing midnight', () => {
      const alarmTime = new Date('2024-10-07T07:30:00');
      const duration = 30;

      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      expect(sunriseStart.getDate()).toBe(7); // Same day
      expect(sunriseStart.getMonth()).toBe(9); // October (0-indexed)
      expect(sunriseStart.getFullYear()).toBe(2024);
    });
  });

  describe('Validation functions', () => {
    describe('isValidTimeFormat', () => {
      test('should validate correct time format', () => {
        expect(isValidTimeFormat('07:00')).toBe(true);
        expect(isValidTimeFormat('23:59')).toBe(true);
        expect(isValidTimeFormat('0:00')).toBe(true);
        expect(isValidTimeFormat('7:00')).toBe(true); // Single-digit hour is valid
      });

      test('should reject invalid time format', () => {
        expect(isValidTimeFormat('25:00')).toBe(false);
        expect(isValidTimeFormat('12:60')).toBe(false);
        expect(isValidTimeFormat('abc')).toBe(false);
        expect(isValidTimeFormat('')).toBe(false);
      });
    });

    describe('isValidDuration', () => {
      test('should validate correct duration', () => {
        expect(isValidDuration(1)).toBe(true);
        expect(isValidDuration(30)).toBe(true);
        expect(isValidDuration(60)).toBe(true);
      });

      test('should reject invalid duration', () => {
        expect(isValidDuration(0)).toBe(false);
        expect(isValidDuration(61)).toBe(false);
        expect(isValidDuration(30.5)).toBe(false);
        expect(isValidDuration('30')).toBe(false);
      });
    });

  });

  describe('Config management', () => {
    test('should return default config', () => {
      const config = getDefaultConfig();
      expect(config.enabled).toBe(false);
      expect(config.wakeTime).toBe('07:00');
      expect(config.duration).toBe(30);
      expect(config.daysOfWeek).toBeUndefined();
    });

    test('should validate and fix valid config', () => {
      const input = {
        enabled: true,
        wakeTime: '08:30',
        duration: 45
      };
      const result = validateAndFixConfig(input);
      expect(result.enabled).toBe(input.enabled);
      expect(result.wakeTime).toBe(input.wakeTime);
      expect(result.duration).toBe(input.duration);
    });

    test('should fix invalid config fields', () => {
      const input = {
        enabled: 'yes', // Invalid
        wakeTime: '25:00', // Invalid
        duration: 100 // Invalid
      };
      const result = validateAndFixConfig(input);
      const defaults = getDefaultConfig();
      expect(result.enabled).toBe(defaults.enabled);
      expect(result.wakeTime).toBe(defaults.wakeTime);
      expect(result.duration).toBe(defaults.duration);
    });

    test('should ignore daysOfWeek in existing configs (migration)', () => {
      const input = {
        enabled: true,
        wakeTime: '08:30',
        duration: 45,
        daysOfWeek: [1, 2, 3] // Should be ignored
      };
      const result = validateAndFixConfig(input);
      expect(result.enabled).toBe(input.enabled);
      expect(result.wakeTime).toBe(input.wakeTime);
      expect(result.duration).toBe(input.duration);
      expect(result.daysOfWeek).toBeUndefined();
    });
  });

  describe('Combined alarm and sunrise workflow', () => {
    test('should calculate complete alarm schedule for morning', () => {
      // 6:00 AM, 30 min duration, 7:00 AM alarm
      const currentDate = new Date('2024-10-07T06:00:00');
      const wakeTime = '07:00';
      const duration = 30;

      const nextAlarm = calculateNextAlarm(wakeTime, currentDate);
      const sunriseStart = calculateSunriseStart(nextAlarm, duration);

      expect(nextAlarm.getHours()).toBe(7);
      expect(nextAlarm.getMinutes()).toBe(0);
      expect(sunriseStart.getHours()).toBe(6);
      expect(sunriseStart.getMinutes()).toBe(30);
      expect(nextAlarm.getTime() - sunriseStart.getTime()).toBe(30 * 60 * 1000); // 30 minutes
    });

    test('should calculate time difference correctly', () => {
      const alarmTime = new Date('2024-10-07T07:00:00');
      const duration = 45; // minutes
      const sunriseStart = calculateSunriseStart(alarmTime, duration);

      const differenceMs = alarmTime - sunriseStart;
      const differenceMinutes = differenceMs / (60 * 1000);

      expect(differenceMinutes).toBe(45);
    });
  });
});
