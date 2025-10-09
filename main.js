const { app, BrowserWindow, ipcMain, screen, powerSaveBlocker } = require('electron');
const path = require('path');
const fs = require('fs');
const {
    calculateNextAlarm,
    getDefaultConfig,
    validateAndFixConfig,
    isValidTimeFormat,
    isValidDuration
} = require('./alarm-utils');

let CONFIG_FILE;

let mainWindow = null;
let alarmWindow = null;
let scheduledTimeout = null;
let powerSaveBlockerId = null;

// Load or create config
function loadConfig() {
    if (!CONFIG_FILE) {
        CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');
    }
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            return validateAndFixConfig(config);
        }
    } catch (err) {
        console.error('Error loading config:', err);
    }
    return getDefaultConfig();
}

function saveConfig(config) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (err) {
        console.error('Error saving config:', err);
    }
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 750,
        height: 750,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        resizable: false,
        title: 'Sunrise Alarm',
        icon: path.join(__dirname, 'icon.png'),
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#000000'
    });

    mainWindow.loadFile('config.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createAlarmWindow(duration, wakeTime) {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    // Prevent system sleep and screensaver
    if (powerSaveBlockerId === null) {
        powerSaveBlockerId = powerSaveBlocker.start('prevent-display-sleep');
    }

    alarmWindow = new BrowserWindow({
        width: width,
        height: height,
        fullscreen: true,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        backgroundColor: '#000000'
    });

    const query = { duration: duration.toString() };
    if (wakeTime) {
        query.wakeTime = wakeTime;
    }

    alarmWindow.loadFile('alarm.html', { query });

    alarmWindow.on('closed', () => {
        alarmWindow = null;
        // Release power save blocker when alarm window closes
        if (powerSaveBlockerId !== null && powerSaveBlocker.isStarted(powerSaveBlockerId)) {
            powerSaveBlocker.stop(powerSaveBlockerId);
            powerSaveBlockerId = null;
        }
    });
}

function scheduleNextAlarm(config) {
    if (scheduledTimeout) {
        clearTimeout(scheduledTimeout);
        scheduledTimeout = null;
    }

    if (!config.enabled) {
        return;
    }

    // Validate config before proceeding
    if (!isValidTimeFormat(config.wakeTime)) {
        console.error('Invalid wakeTime format:', config.wakeTime);
        return;
    }

    if (!isValidDuration(config.duration)) {
        console.error('Invalid duration:', config.duration);
        return;
    }

    const now = new Date();
    const nextAlarm = calculateNextAlarm(config.wakeTime, config.daysOfWeek, now);
    const msUntilAlarm = nextAlarm - now;

    // Max setTimeout is ~24.8 days, but we'll reschedule daily anyway
    if (msUntilAlarm > 0 && msUntilAlarm < 2147483647) {
        scheduledTimeout = setTimeout(() => {
            createAlarmWindow(config.duration);
            // Schedule next alarm after this one
            setTimeout(() => {
                scheduleNextAlarm(config);
            }, 1000);
        }, msUntilAlarm);

        console.log(`Next alarm scheduled for: ${nextAlarm.toString()}`);
    }
}

// IPC handlers
ipcMain.on('get-config', (event) => {
    event.reply('config-data', loadConfig());
});

ipcMain.on('save-config', (event, config) => {
    saveConfig(config);
    scheduleNextAlarm(config);
    event.reply('config-saved', true);
});

ipcMain.on('test-alarm', (event, duration, wakeTime) => {
    createAlarmWindow(duration, wakeTime);
});

ipcMain.on('close-alarm', () => {
    if (alarmWindow) {
        alarmWindow.close();
    }
    // Show main window if it's not visible
    if (!mainWindow) {
        createMainWindow();
    } else {
        mainWindow.show();
        mainWindow.focus();
    }
});

ipcMain.on('get-next-alarm', (event) => {
    const config = loadConfig();
    if (!config.enabled) {
        event.reply('next-alarm-time', null);
        return;
    }

    // Validate config before proceeding
    if (!isValidTimeFormat(config.wakeTime)) {
        console.error('Invalid wakeTime format:', config.wakeTime);
        event.reply('next-alarm-time', null);
        return;
    }

    const now = new Date();
    const nextAlarm = calculateNextAlarm(config.wakeTime, config.daysOfWeek, now);

    event.reply('next-alarm-time', nextAlarm.toString());
});

app.whenReady().then(() => {
    createMainWindow();

    // Schedule alarm on startup
    const config = loadConfig();
    scheduleNextAlarm(config);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    if (scheduledTimeout) {
        clearTimeout(scheduledTimeout);
    }
});
