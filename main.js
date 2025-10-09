const { app, BrowserWindow, ipcMain, screen, powerSaveBlocker } = require('electron');
const path = require('path');
const fs = require('fs');

const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');

let mainWindow = null;
let alarmWindow = null;
let scheduledTimeout = null;
let powerSaveBlockerId = null;

// Load or create config
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('Error loading config:', err);
    }
    return {
        enabled: false,
        wakeTime: '07:00',
        duration: 30,
        daysOfWeek: [1, 2, 3, 4, 5] // Monday-Friday
    };
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

    const now = new Date();
    const [hours, minutes] = config.wakeTime.split(':').map(Number);

    let nextAlarm = new Date();
    nextAlarm.setHours(hours, minutes, 0, 0);

    // Check if today is valid and time hasn't passed
    const todayIsValid = config.daysOfWeek.includes(nextAlarm.getDay());
    const timeHasPassed = nextAlarm <= now;

    // If time has passed today OR today is not a valid day, start looking from tomorrow
    if (timeHasPassed || !todayIsValid) {
        nextAlarm.setDate(nextAlarm.getDate() + 1);
        // Find next valid day of week
        while (!config.daysOfWeek.includes(nextAlarm.getDay())) {
            nextAlarm.setDate(nextAlarm.getDate() + 1);
        }
    }

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

    const now = new Date();
    const [hours, minutes] = config.wakeTime.split(':').map(Number);

    let nextAlarm = new Date();
    nextAlarm.setHours(hours, minutes, 0, 0);

    // Check if today is valid and time hasn't passed
    const todayIsValid = config.daysOfWeek.includes(nextAlarm.getDay());
    const timeHasPassed = nextAlarm <= now;

    // If time has passed today OR today is not a valid day, start looking from tomorrow
    if (timeHasPassed || !todayIsValid) {
        nextAlarm.setDate(nextAlarm.getDate() + 1);
        // Find next valid day of week
        while (!config.daysOfWeek.includes(nextAlarm.getDay())) {
            nextAlarm.setDate(nextAlarm.getDate() + 1);
        }
    }

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
