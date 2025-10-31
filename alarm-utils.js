/**
 * Alarm calculation utilities
 * These functions handle alarm scheduling and sunrise time calculations
 */

/**
 * Calculates the next alarm time based on configuration
 * @param {string} wakeTime - Time in HH:MM format
 * @param {Date} currentDate - Current date/time (defaults to now)
 * @returns {Date} The next scheduled alarm time
 */
function calculateNextAlarm(wakeTime, currentDate = new Date()) {
  const [hours, minutes] = wakeTime.split(':').map(Number);

  let nextAlarm = new Date(currentDate);
  nextAlarm.setHours(hours, minutes, 0, 0);

  // If time has passed today, schedule for tomorrow
  if (nextAlarm <= currentDate) {
    nextAlarm.setDate(nextAlarm.getDate() + 1);
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
 * Default configuration
 * @returns {Object} Default config object
 */
function getDefaultConfig() {
  return {
    enabled: false,
    wakeTime: '07:00',
    duration: 30
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

  // Note: daysOfWeek property in existing configs is ignored (migrated to "every day" behavior)

  return fixed;
}

// Export for Node.js (Jest tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateNextAlarm,
    calculateSunriseStart,
    isValidTimeFormat,
    isValidDuration,
    getDefaultConfig,
    validateAndFixConfig
  };
}
