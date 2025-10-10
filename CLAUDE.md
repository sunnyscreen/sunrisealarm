# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sunnyscreen** is an Electron-based sunrise alarm application that gradually brightens the screen to simulate a sunrise and wake users gently. The app runs on macOS and includes:
- Configuration window for alarm settings
- Full-screen alarm window with gradual brightness animation
- Persistent alarm scheduling with day-of-week selection
- Power save blocker to prevent screen dimming during alarm

## Core Architecture

### Two-Window System
The app uses Electron's multi-window architecture:

1. **Main Window** (`config.html`): Configuration interface where users set:
   - Wake time (HH:MM format)
   - Sunrise duration (1-60 minutes)
   - Active days of week (0=Sunday, 6=Saturday)
   - Alarm enabled/disabled state

2. **Alarm Window** (`alarm.html`): Full-screen window that:
   - Displays gradual brightness animation from black to white
   - Shows current time and simulated sunrise effect
   - Blocks power save/screensaver during alarm
   - Closes on any user interaction

### State Management
- Configuration is stored in `config.json` (in Electron's userData directory)
- `main.js` handles IPC communication between windows and manages alarm scheduling
- `alarm-utils.js` contains pure functions for alarm calculations and validation
- All alarm logic is deterministic and testable

### Alarm Scheduling Logic
Key concept: The app calculates the next valid alarm time by:
1. Checking if today is a valid day AND time hasn't passed
2. If not, advancing to the next valid day of week
3. Using `setTimeout` to trigger the alarm window at the calculated time
4. Automatically rescheduling after each alarm fires

## Testing Architecture

### Three-Tier Test Strategy

1. **Unit Tests** (Jest)
   - Test `alarm-utils.js` pure functions
   - Coverage threshold: 80% for branches, functions, lines, statements
   - Run with: `npm test`
   - Watch mode: `npm run test:watch`

2. **Local E2E Tests** (Playwright)
   - Test Electron app functionality (`tests/e2e/app.spec.js`)
   - Test local dashboard UI (`tests/e2e/dashboard.spec.js`)
   - Run with: `npm run test:e2e`
   - **Important**: Excludes `dashboard-deployed.spec.js` via `testIgnore` config

3. **Post-Deployment E2E Tests** (Playwright)
   - Test live deployed dashboard (`tests/e2e/dashboard-deployed.spec.js`)
   - Run with: `npm run test:e2e:deployed` (sets `TEST_DEPLOYED=true`)
   - Only runs against https://bradnemer.github.io/sunnyscreen/tests/

### Test Dashboard
- Interactive dashboard at `/tests` showing all test results with videos
- Three tabs: Unit Tests, Local E2E Tests, Post-Deployment E2E Tests
- Local server: `npm run test:dashboard` → http://localhost:3000/tests
- Deployed version: Auto-updated on every merge to main

## CI/CD Pipeline

### Six-Stage Pipeline (on push to main)
The `.github/workflows/ci-cd.yml` workflow runs these jobs sequentially:

1. **version**: Auto-generates version number using GitHub run number (1.0.X)
2. **build**: Builds macOS .dmg and .zip on macOS runner
3. **test**: Runs unit tests + local E2E tests, uploads results as artifacts
4. **release**: Creates GitHub Release with macOS binaries
5. **deploy-pages**: Deploys homepage and test dashboard with pre-deployment results
6. **validate-deployment**: Tests live site, uploads post-deployment results
7. **redeploy-with-validation**: Combines all results and redeploys dashboard

### Two-Stage Dashboard Deployment
The pipeline deploys the dashboard twice:
- **First deployment**: Contains pre-deployment test results (unit + local E2E)
- **Second deployment**: Adds post-deployment validation results to dashboard

This ensures the live dashboard always shows complete test coverage including validation of the deployed site itself.

## Common Development Commands

### Running the App
```bash
npm start                    # Launch Electron app locally
```

### Testing
```bash
npm test                     # Run unit tests with JSON output
npm run test:watch           # Run unit tests in watch mode
npm run test:e2e             # Run local E2E tests (excludes deployed tests)
npm run test:e2e:deployed    # Run post-deployment tests against live site
npm run test:all             # Run unit + local E2E tests sequentially
npm run test:dashboard       # Start local test dashboard server on :3000
```

### Building
```bash
npm run build:mac            # Build macOS .dmg and .zip
npm run build:win            # Build Windows installers
npm run build:linux          # Build Linux packages
```

### Running Single Tests
```bash
# Jest - run specific test file
npx jest alarm-utils.test.js

# Jest - run tests matching pattern
npx jest --testNamePattern="calculateNextAlarm"

# Playwright - run specific test file
npx playwright test tests/e2e/app.spec.js

# Playwright - run specific test by name
npx playwright test -g "should launch and display config window"

# Playwright - debug mode with headed browser
npx playwright test --debug
```

## Important Implementation Notes

### Electron Configuration
- **Node Integration**: Enabled (`nodeIntegration: true`) - required for IPC
- **Context Isolation**: Disabled - allows renderer access to Node APIs
- **Code Signing**: Disabled for development (`identity: null`, `gatekeeperAssess: false`)
- Users must bypass macOS Gatekeeper: Right-click → Open, or run `xattr -cr "/Applications/Sunrise Alarm.app"`

### Test Configuration Quirks
- `playwright.config.js` uses `testIgnore` with env var to exclude deployed tests from normal runs
- `run-tests-with-json.js` is a wrapper around Jest that generates JSON output (workaround for jest-json-reporter issues)
- Playwright records videos for ALL tests (passed and failed) via `video: 'on'`
- Test artifacts are uploaded to GitHub Actions with 90-day retention

### IPC Communication Pattern
The app uses Electron's IPC for window communication:
- Renderer → Main: `ipcRenderer.send('event-name', data)`
- Main → Renderer: `event.reply('event-name', data)`
- Main process handlers are in `main.js` (lines 142-187)

### Power Management
The alarm window uses `powerSaveBlocker` to prevent:
- System sleep
- Display sleep
- Screensaver activation

This is critical for alarm functionality - blocker is started when alarm window opens and stopped when it closes.

### Time Handling
- All times internally use JavaScript `Date` objects
- User-facing times are in HH:MM format (24-hour)
- Days of week are 0-indexed arrays (0=Sunday, 6=Saturday)
- `calculateNextAlarm()` handles edge cases like midnight crossing and week boundaries

## File Structure Notes

### Application Files (bundled in builds)
- `main.js` - Electron main process, window management, IPC handlers
- `alarm-utils.js` - Pure utility functions for alarm calculations
- `config.html` - Configuration window UI
- `alarm.html` - Full-screen alarm window UI
- `icon.png` - App icon

### Test Files
- `tests/e2e/app.spec.js` - E2E tests for Electron app
- `tests/e2e/dashboard.spec.js` - E2E tests for local dashboard
- `tests/e2e/dashboard-deployed.spec.js` - E2E tests for deployed dashboard
- `__tests__/alarm-utils.test.js` - Unit tests for alarm utilities

### Configuration Files
- `jest.config.js` - Jest test configuration with HTML reporter
- `playwright.config.js` - Playwright E2E test configuration
- `run-tests-with-json.js` - Custom Jest runner for JSON output
- `test-server.js` - Express server for local test dashboard

### GitHub Pages
- `index.html` - Homepage (deployed at root)
- `tests/index.html` - Test dashboard (deployed at /tests/)
- Both auto-deploy on merge to main via CI/CD workflow

## Known Constraints

- macOS builds require disabling code signing (no Apple Developer certificate)
- Alarm scheduling uses `setTimeout` which has ~24.8 day max - handled by rescheduling
- Node.js child processes and Electron require different test approaches (Jest vs Playwright)
- GitHub Pages deployment is two-stage to include post-deployment validation results
