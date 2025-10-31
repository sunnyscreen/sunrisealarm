/**
 * Tests for config validation using the real validation functions
 */

const {
  isValidTimeFormat,
  isValidDuration
} = require('../alarm-utils');

describe('Config Validation', () => {
  describe('Time format validation', () => {
    test('valid time format 07:00', () => {
      expect(isValidTimeFormat('07:00')).toBe(true);
    });

    test('valid time format 23:59', () => {
      expect(isValidTimeFormat('23:59')).toBe(true);
    });

    test('invalid time format 25:00', () => {
      expect(isValidTimeFormat('25:00')).toBe(false);
    });

    test('invalid time format 12:60', () => {
      expect(isValidTimeFormat('12:60')).toBe(false);
    });
  });

  describe('Duration validation', () => {
    test('valid duration 30', () => {
      expect(isValidDuration(30)).toBe(true);
    });

    test('valid duration 1', () => {
      expect(isValidDuration(1)).toBe(true);
    });

    test('valid duration 60', () => {
      expect(isValidDuration(60)).toBe(true);
    });

    test('invalid duration 0', () => {
      expect(isValidDuration(0)).toBe(false);
    });

    test('invalid duration 61', () => {
      expect(isValidDuration(61)).toBe(false);
    });

    test('invalid duration 30.5', () => {
      expect(isValidDuration(30.5)).toBe(false);
    });
  });
});
