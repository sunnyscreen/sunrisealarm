# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sunnyscreen** is a pure web-based sunrise alarm application that gradually brightens the screen to simulate a sunrise and wake users gently. The app runs in any modern web browser and includes:
- Single-page web application for alarm configuration and display
- Full-screen alarm animation with gradual brightness effect
- Persistent alarm scheduling with day-of-week selection
- Wake Lock API to prevent screen dimming during alarm
- No installation required - works instantly in the browser

## Core Architecture

### Single-Page Web Application
The app is a self-contained web application (`app.html`):

**Configuration Interface**:
- Wake time selection (HH:MM format)
- Sunrise duration (1-60 minutes)
- Day-of-week selection (0=Sunday, 6=Saturday)
- Test alarm button for immediate preview
- Power management settings modal

**Alarm Display**:
- Full-screen overlay with gradual brightness animation
- Smooth color transitions from deep blue through red/orange to bright yellow
- Real-time clock display
- Dismissible by clicking anywhere or pressing Escape

### State Management
- Configuration stored in browser's `localStorage`
- `alarm-utils.js` contains pure functions for alarm calculations and validation
- All alarm logic is deterministic and testable
- No backend required - fully client-side application

### Alarm Scheduling Logic
The app calculates the next valid alarm time by:
1. Checking if today is a valid day AND time hasn't passed
2. If not, advancing to the next valid day of week
3. Using `setTimeout` to trigger the alarm overlay at the calculated time
4. Automatically rescheduling after each alarm fires
5. Persisting state across page refreshes via localStorage

## Testing Architecture

### Two-Tier Test Strategy

1. **Unit Tests** (Jest)
   - Test `alarm-utils.js` pure functions
   - Coverage threshold: 80% for branches, functions, lines, statements
   - Run with: `npm test`
   - Watch mode: `npm run test:watch`

2. **E2E Tests** (Playwright)
   - Test web app functionality (`tests/e2e/webapp.spec.js`)
   - Test alarm timing logic (`tests/e2e/alarm-timing.spec.js`)
   - Run locally with: `npm run test:e2e`
   - Run against preview deployment: `npm run test:e2e:preview`

### Test Dashboard
- Interactive dashboard at `/tests` showing all test results
- Local server: `npm run test:dashboard` → http://localhost:3000/tests
- Deployed version: Auto-updated on deployments via Vercel

## CI/CD Pipeline

### Vercel Deployment Pipeline
The `.github/workflows/vercel-tests.yml` workflow runs on every push:

1. **unit-tests**: Runs Jest unit tests for pure functions
2. **e2e-tests**: Runs after Vercel deployment succeeds, tests preview site
3. **promote-to-production**: Auto-merges preview → main after E2E tests pass

### Preview → Production Flow
- Push to `preview` branch triggers Vercel preview deployment
- After deployment succeeds, E2E tests run against preview URL
- If tests pass, preview branch auto-merges to `main`
- Main branch auto-deploys to production via Vercel

## Common Development Commands

### Running the App
```bash
npm start                    # Start local development server on http://localhost:3000
                             # Opens web app at http://localhost:3000/app
npm run test:dashboard       # Same as npm start (serves test dashboard)
```

### Testing
```bash
npm test                     # Run unit tests with JSON output
npm run test:watch           # Run unit tests in watch mode
npm run test:e2e             # Run E2E tests against local server
npm run test:e2e:preview     # Run E2E tests against Vercel preview
```

### Running Single Tests
```bash
# Jest - run specific test file
npx jest alarm-utils.test.js

# Jest - run tests matching pattern
npx jest --testNamePattern="calculateNextAlarm"

# Playwright - run specific test file
npx playwright test tests/e2e/webapp.spec.js

# Playwright - run specific test by name
npx playwright test -g "should load the app with default configuration"

# Playwright - debug mode with headed browser
npx playwright test --debug
```

## Important Implementation Notes

### Browser Compatibility
- Requires modern browser with ES6+ support
- Wake Lock API support recommended (Chrome 84+, Edge 84+, Safari 16.4+)
- Falls back gracefully if Wake Lock API not available
- Uses localStorage for persistence (5-10MB available in most browsers)

### Wake Lock API
The app uses the Screen Wake Lock API to prevent:
- Screen dimming during alarm
- System sleep during alarm

This is requested when alarm starts and released when it ends. If not supported, app displays warning banner to keep tab active.

### Test Configuration
- `run-tests-with-json.js` is a wrapper around Jest that generates JSON output
- Playwright tests run against local server (localhost:3000) or Vercel preview
- Test artifacts include videos of failed tests
- E2E tests automatically wait for Vercel deployment before running in CI

### Time Handling
- All times internally use JavaScript `Date` objects
- User-facing times are in HH:MM format (24-hour)
- Days of week are 0-indexed arrays (0=Sunday, 6=Saturday)
- `calculateNextAlarm()` handles edge cases like midnight crossing and week boundaries

## File Structure Notes

### Application Files
- `app.html` - Main web application (config + alarm display)
- `alarm-utils.js` - Pure utility functions for alarm calculations
- `test-server.js` - Express server for local development
- `icon.png` - App icon

### Test Files
- `tests/e2e/webapp.spec.js` - E2E tests for web app functionality
- `tests/e2e/alarm-timing.spec.js` - E2E tests for alarm scheduling logic
- `__tests__/*.test.js` - Unit tests for alarm utility functions

### Configuration Files
- `jest.config.js` - Jest test configuration with HTML reporter
- `playwright.config.js` - Playwright E2E test configuration
- `run-tests-with-json.js` - Custom Jest runner for JSON output
- `vercel.json` - Vercel deployment configuration

### Deployed Pages
- `index.html` - Marketing homepage
- `app.html` - Web application
- `tests/index.html` - Test dashboard
- All deployed via Vercel on push to main

## Known Constraints

- Browser tab must remain active for alarm to fire reliably (Wake Lock API helps but doesn't guarantee)
- Alarm scheduling uses `setTimeout` which has ~24.8 day max - handled by rescheduling
- localStorage limited to ~5-10MB (more than sufficient for alarm config)
- Fullscreen API requires user gesture - triggered by alarm start button
- Wake Lock API not supported in all browsers (Firefox currently lacks support)
