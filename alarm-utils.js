/**
 * Alarm calculation utilities
 * These functions handle alarm scheduling and sunrise time calculations
 */

/**
 * Calculates the next alarm time based on configuration
 * @param {string} wakeTime - Time in HH:MM format
 * @param {number[]} daysOfWeek - Array of valid days (0=Sunday, 6=Saturday)
 * @param {Date} currentDate - Current date/time (defaults to now)
 * @returns {Date} The next scheduled alarm time
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

/**
 * Calculates when sunrise should begin (alarm time minus duration)
 * @param {Date} alarmTime - The alarm time
 * @param {number} durationMinutes - Duration in minutes
 * @returns {Date} The time when sunrise should start
 */
function calculateSunriseStart(alarmTime, durationMinutes) {
  return new Date(alarmTime.getTime() - durationMinutes * 60000);
}

/**
 * Validates time format (HH:MM)
 * @param {string} timeString - Time string to validate
 * @returns {boolean} True if valid
 */
function isValidTimeFormat(timeString) {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString);
}

/**
 * Validates duration (1-60 whole number)
 * @param {number} duration - Duration to validate
 * @returns {boolean} True if valid
 */
function isValidDuration(duration) {
  return typeof duration === 'number' &&
         Number.isInteger(duration) &&
         duration >= 1 &&
         duration <= 60;
}

/**
 * Validates days of week array
 * @param {number[]} days - Array of day numbers
 * @returns {boolean} True if valid
 */
function isValidDaysOfWeek(days) {
  return Array.isArray(days) &&
         days.length > 0 &&
         days.every(day => typeof day === 'number' && day >= 0 && day <= 6);
}

/**
 * Default configuration
 * @returns {Object} Default config object
 */
function getDefaultConfig() {
  return {
    enabled: false,
    wakeTime: '07:00',
    duration: 30,
    daysOfWeek: [1, 2, 3, 4, 5] // Monday-Friday
  };
}

/**
 * Validates and fixes configuration
 * @param {Object} config - Configuration to validate
 * @returns {Object} Valid configuration
 */
function validateAndFixConfig(config) {
  const defaultConfig = getDefaultConfig();
  const fixed = { ...defaultConfig };

  // Validate enabled
  if (typeof config.enabled === 'boolean') {
    fixed.enabled = config.enabled;
  }

  // Validate wakeTime
  if (typeof config.wakeTime === 'string' && isValidTimeFormat(config.wakeTime)) {
    fixed.wakeTime = config.wakeTime;
  }

  // Validate duration
  if (isValidDuration(config.duration)) {
    fixed.duration = config.duration;
  }

  // Validate daysOfWeek
  if (isValidDaysOfWeek(config.daysOfWeek)) {
    fixed.daysOfWeek = config.daysOfWeek;
  }

  return fixed;
}

// Export for Node.js (Jest tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateNextAlarm,
    calculateSunriseStart,
    isValidTimeFormat,
    isValidDuration,
    isValidDaysOfWeek,
    getDefaultConfig,
    validateAndFixConfig
  };
}
