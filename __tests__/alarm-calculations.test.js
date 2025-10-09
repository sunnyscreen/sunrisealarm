/**
 * Unit tests for alarm and sunrise calculations
 */

describe('Alarm Calculations', () => {
  describe('Next alarm time calculation', () => {
    /**
     * Simulates the logic from main.js scheduleNextAlarm()
     */
    function calculateNextAlarm(wakeTime, daysOfWeek, currentDate = new Date()) {
      const [hours, minutes] = wakeTime.split(':').map(Number);

      let nextAlarm = new Date(currentDate);
      nextAlarm.setHours(hours, minutes, 0, 0);

      // Check if today is valid and time hasn't passed
      const todayIsValid = daysOfWeek.includes(nextAlarm.getDay());
      const timeHasPassed = nextAlarm <= currentDate;

      // If time has passed today OR today is not a valid day, start looking from tomorrow
      if (timeHasPassed || !todayIsValid) {
        nextAlarm.setDate(nextAlarm.getDate() + 1);
        // Find next valid day of week
        while (!daysOfWeek.includes(nextAlarm.getDay())) {
          nextAlarm.setDate(nextAlarm.getDate() + 1);
        }
      }

      return nextAlarm;
    }

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
    /**
     * Calculates when sunrise begins (alarm time minus duration)
     * Duration is in minutes
     */
    function calculateSunriseStart(alarmTime, durationMinutes) {
      return new Date(alarmTime.getTime() - durationMinutes * 60000);
    }

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

  describe('Combined alarm and sunrise workflow', () => {
    test('should calculate complete alarm schedule for weekday morning', () => {
      // Monday at 6:00 AM, 30 min duration, 7:00 AM alarm
      const currentDate = new Date('2024-10-07T06:00:00');
      const wakeTime = '07:00';
      const duration = 30;
      const daysOfWeek = [1, 2, 3, 4, 5];

      const [hours, minutes] = wakeTime.split(':').map(Number);
      let nextAlarm = new Date(currentDate);
      nextAlarm.setHours(hours, minutes, 0, 0);

      const sunriseStart = new Date(nextAlarm.getTime() - duration * 60000);

      expect(nextAlarm.getHours()).toBe(7);
      expect(nextAlarm.getMinutes()).toBe(0);
      expect(sunriseStart.getHours()).toBe(6);
      expect(sunriseStart.getMinutes()).toBe(30);
      expect(nextAlarm.getTime() - sunriseStart.getTime()).toBe(30 * 60 * 1000); // 30 minutes
    });

    test('should calculate time difference correctly', () => {
      const alarmTime = new Date('2024-10-07T07:00:00');
      const duration = 45; // minutes
      const sunriseStart = new Date(alarmTime.getTime() - duration * 60000);

      const differenceMs = alarmTime - sunriseStart;
      const differenceMinutes = differenceMs / (60 * 1000);

      expect(differenceMinutes).toBe(45);
    });
  });
});
