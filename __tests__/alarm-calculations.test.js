/**
 * Unit tests for alarm and sunrise calculations
 */

const {
  calculateNextAlarm,
  calculateSunriseStart,
  isValidTimeFormat,
  isValidDuration,
  isValidDaysOfWeek,
  getDefaultConfig,
  validateAndFixConfig
} = require('../alarm-utils');

describe('Alarm Calculations', () => {
  describe('Next alarm time calculation', () => {
    test('should schedule alarm for today if time has not passed and day is valid', () => {
      // Monday at 6:00 AM, alarm set for 7:00 AM on weekdays
      const currentDate = new Date('2024-10-07T06:00:00'); // Monday
      const wakeTime = '07:00';
      const daysOfWeek = [1, 2, 3, 4, 5]; // Mon-Fri

      const nextAlarm = calculateNextAlarm(wakeTime, daysOfWeek, currentDate);

      expect(nextAlarm.getDate()).toBe(7); // Same day
      expect(nextAlarm.getHours()).toBe(7);
      expect(nextAlarm.getMinutes()).toBe(0);
    });

    test('should schedule alarm for tomorrow if time has passed today', () => {
      // Monday at 8:00 AM, alarm set for 7:00 AM on weekdays
      const currentDate = new Date('2024-10-07T08:00:00'); // Monday
      const wakeTime = '07:00';
      const daysOfWeek = [1, 2, 3, 4, 5]; // Mon-Fri

      const nextAlarm = calculateNextAlarm(wakeTime, daysOfWeek, currentDate);

      expect(nextAlarm.getDate()).toBe(8); // Tuesday
      expect(nextAlarm.getDay()).toBe(2); // Tuesday
      expect(nextAlarm.getHours()).toBe(7);
      expect(nextAlarm.getMinutes()).toBe(0);
    });

    test('should skip to next valid day if today is not in daysOfWeek', () => {
      // Saturday at 6:00 AM, alarm set for 7:00 AM on weekdays only
      const currentDate = new Date('2024-10-12T06:00:00'); // Saturday
      const wakeTime = '07:00';
      const daysOfWeek = [1, 2, 3, 4, 5]; // Mon-Fri

      const nextAlarm = calculateNextAlarm(wakeTime, daysOfWeek, currentDate);

      expect(nextAlarm.getDate()).toBe(14); // Monday
      expect(nextAlarm.getDay()).toBe(1); // Monday
      expect(nextAlarm.getHours()).toBe(7);
    });

    test('should skip weekend to Monday', () => {
      // Friday at 8:00 AM (after 7am alarm), should schedule for Monday
      const currentDate = new Date('2024-10-11T08:00:00'); // Friday
      const wakeTime = '07:00';
      const daysOfWeek = [1, 2, 3, 4, 5]; // Mon-Fri

      const nextAlarm = calculateNextAlarm(wakeTime, daysOfWeek, currentDate);

      expect(nextAlarm.getDate()).toBe(14); // Monday
      expect(nextAlarm.getDay()).toBe(1); // Monday
    });

    test('should work with weekend-only schedule', () => {
      // Thursday at 6:00 AM, alarm set for weekends only
      const currentDate = new Date('2024-10-10T06:00:00'); // Thursday
      const wakeTime = '09:00';
      const daysOfWeek = [0, 6]; // Sun, Sat

      const nextAlarm = calculateNextAlarm(wakeTime, daysOfWeek, currentDate);

      expect(nextAlarm.getDate()).toBe(12); // Saturday
      expect(nextAlarm.getDay()).toBe(6); // Saturday
      expect(nextAlarm.getHours()).toBe(9);
    });

    test('should work with single day schedule', () => {
      // Tuesday at 6:00 AM, alarm set for Fridays only
      const currentDate = new Date('2024-10-08T06:00:00'); // Tuesday
      const wakeTime = '07:00';
      const daysOfWeek = [5]; // Friday only

      const nextAlarm = calculateNextAlarm(wakeTime, daysOfWeek, currentDate);

      expect(nextAlarm.getDate()).toBe(11); // Friday
      expect(nextAlarm.getDay()).toBe(5); // Friday
    });

    test('should handle midnight alarm time', () => {
      // Monday at 11:00 PM
      const currentDate = new Date('2024-10-07T23:00:00'); // Monday
      const wakeTime = '00:00';
      const daysOfWeek = [1, 2, 3, 4, 5]; // Mon-Fri

      const nextAlarm = calculateNextAlarm(wakeTime, daysOfWeek, currentDate);

      expect(nextAlarm.getDate()).toBe(8); // Tuesday
      expect(nextAlarm.getHours()).toBe(0);
      expect(nextAlarm.getMinutes()).toBe(0);
    });

    test('should handle late night alarm time', () => {
      // Monday at 10:00 PM, alarm for 11:30 PM
      const currentDate = new Date('2024-10-07T22:00:00'); // Monday
      const wakeTime = '23:30';
      const daysOfWeek = [1, 2, 3, 4, 5]; // Mon-Fri

      const nextAlarm = calculateNextAlarm(wakeTime, daysOfWeek, currentDate);

      expect(nextAlarm.getDate()).toBe(7); // Same day
      expect(nextAlarm.getHours()).toBe(23);
      expect(nextAlarm.getMinutes()).toBe(30);
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

    describe('isValidDaysOfWeek', () => {
      test('should validate correct days array', () => {
        expect(isValidDaysOfWeek([1, 2, 3, 4, 5])).toBe(true);
        expect(isValidDaysOfWeek([0, 6])).toBe(true);
        expect(isValidDaysOfWeek([3])).toBe(true);
      });

      test('should reject invalid days array', () => {
        expect(isValidDaysOfWeek([1, 2, 7])).toBe(false);
        expect(isValidDaysOfWeek([1, 2, -1])).toBe(false);
        expect(isValidDaysOfWeek([])).toBe(false);
        expect(isValidDaysOfWeek('123')).toBe(false);
      });
    });
  });

  describe('Config management', () => {
    test('should return default config', () => {
      const config = getDefaultConfig();
      expect(config.enabled).toBe(false);
      expect(config.wakeTime).toBe('07:00');
      expect(config.duration).toBe(30);
      expect(config.daysOfWeek).toEqual([1, 2, 3, 4, 5]);
    });

    test('should validate and fix valid config', () => {
      const input = {
        enabled: true,
        wakeTime: '08:30',
        duration: 45,
        daysOfWeek: [1, 2, 3]
      };
      const result = validateAndFixConfig(input);
      expect(result).toEqual(input);
    });

    test('should fix invalid config fields', () => {
      const input = {
        enabled: 'yes', // Invalid
        wakeTime: '25:00', // Invalid
        duration: 100, // Invalid
        daysOfWeek: [1, 2, 8] // Invalid
      };
      const result = validateAndFixConfig(input);
      const defaults = getDefaultConfig();
      expect(result.enabled).toBe(defaults.enabled);
      expect(result.wakeTime).toBe(defaults.wakeTime);
      expect(result.duration).toBe(defaults.duration);
      expect(result.daysOfWeek).toEqual(defaults.daysOfWeek);
    });
  });

  describe('Combined alarm and sunrise workflow', () => {
    test('should calculate complete alarm schedule for weekday morning', () => {
      // Monday at 6:00 AM, 30 min duration, 7:00 AM alarm
      const currentDate = new Date('2024-10-07T06:00:00');
      const wakeTime = '07:00';
      const duration = 30;
      const daysOfWeek = [1, 2, 3, 4, 5];

      const nextAlarm = calculateNextAlarm(wakeTime, daysOfWeek, currentDate);
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
