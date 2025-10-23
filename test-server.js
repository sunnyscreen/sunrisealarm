const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Mock in-memory database for local testing
const mockDB = {
    users: new Map(), // userId -> { email, password (hashed), role, created }
    emailToUserId: new Map(), // email -> userId
    tokens: new Map(), // token -> { userId, email, expires }
    alarms: new Map(), // userId -> alarmData
};

// Mock authentication helpers
function generateToken() {
    return 'mock_token_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function verifyToken(token) {
    const tokenData = mockDB.tokens.get(token);
    if (!tokenData) return null;
    if (tokenData.expires < Date.now()) {
        mockDB.tokens.delete(token);
        return null;
    }
    return tokenData;
}

function extractToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.substring(7);
}

// Initialize with a test admin user
const adminUserId = 'admin_1';
mockDB.users.set(adminUserId, {
    email: 'admin@test.com',
    password: '$2a$10$mockhashedpassword', // mock hash
    role: 'admin',
    created: new Date().toISOString()
});
mockDB.emailToUserId.set('admin@test.com', adminUserId);

// Initialize with a test free user
const freeUserId = 'user_1';
mockDB.users.set(freeUserId, {
    email: 'user@test.com',
    password: '$2a$10$mockhashedpassword', // mock hash
    role: 'free',
    created: new Date().toISOString()
});
mockDB.emailToUserId.set('user@test.com', freeUserId);

// Serve static files from test-results directory
app.use('/test-results', express.static(path.join(__dirname, 'test-results')));

// Serve lib directory for client-side scripts
app.use('/lib', express.static(path.join(__dirname, 'lib')));

// ===== MOCK AUTH API ENDPOINTS =====

// Auth - Register
app.post('/api/auth/register', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    if (mockDB.emailToUserId.has(email.toLowerCase())) {
        return res.status(400).json({ error: 'Email already registered' });
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user = {
        email: email.toLowerCase(),
        password: 'mock_hash_' + password, // In real app, use bcrypt
        role: 'free',
        created: new Date().toISOString()
    };

    mockDB.users.set(userId, user);
    mockDB.emailToUserId.set(email.toLowerCase(), userId);

    const token = generateToken();
    mockDB.tokens.set(token, {
        userId,
        email: email.toLowerCase(),
        expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    });

    res.status(201).json({
        success: true,
        token,
        user: { userId, email: email.toLowerCase(), role: 'free' }
    });
});

// Auth - Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    const userId = mockDB.emailToUserId.get(email.toLowerCase());
    if (!userId) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = mockDB.users.get(userId);
    // In a real app, use bcrypt.compare - for testing, accept any password

    const token = generateToken();
    mockDB.tokens.set(token, {
        userId,
        email: email.toLowerCase(),
        expires: Date.now() + (7 * 24 * 60 * 60 * 1000)
    });

    res.json({
        success: true,
        token,
        user: { userId, email: user.email, role: user.role }
    });
});

// Auth - Verify
app.get('/api/auth/verify', (req, res) => {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = mockDB.users.get(tokenData.userId);
    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }

    res.json({
        success: true,
        user: {
            userId: tokenData.userId,
            email: user.email,
            role: user.role
        }
    });
});

// User - Profile
app.get('/api/user/profile', (req, res) => {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const user = mockDB.users.get(tokenData.userId);
    res.json({
        success: true,
        user: {
            userId: tokenData.userId,
            email: user.email,
            role: user.role,
            created: user.created
        }
    });
});

// Alarms - Save
app.post('/api/alarms/save', (req, res) => {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const { alarmData } = req.body;
    mockDB.alarms.set(tokenData.userId, alarmData);

    res.json({ success: true });
});

// Alarms - Get
app.get('/api/alarms/get', (req, res) => {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const alarms = mockDB.alarms.get(tokenData.userId);
    res.json({ success: true, alarms: alarms || null });
});

// Admin - Get All Users
app.get('/api/admin/users', (req, res) => {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const user = mockDB.users.get(tokenData.userId);
    if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const users = [];
    for (const [userId, userData] of mockDB.users.entries()) {
        users.push({
            userId,
            email: userData.email,
            role: userData.role,
            created: userData.created
        });
    }

    res.json({ success: true, users });
});

// Admin - Get User
app.get('/api/admin/user', (req, res) => {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const user = mockDB.users.get(tokenData.userId);
    if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.query;
    const targetUser = mockDB.users.get(userId);
    if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        success: true,
        user: {
            userId,
            email: targetUser.email,
            role: targetUser.role,
            created: targetUser.created
        }
    });
});

// Admin - Update User Role
app.put('/api/admin/user', (req, res) => {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const user = mockDB.users.get(tokenData.userId);
    if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.query;
    const { role } = req.body;

    const targetUser = mockDB.users.get(userId);
    if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
    }

    targetUser.role = role;
    res.json({ success: true });
});

// Admin - Delete User
app.delete('/api/admin/user', (req, res) => {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const user = mockDB.users.get(tokenData.userId);
    if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.query;
    const targetUser = mockDB.users.get(userId);
    if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
    }

    mockDB.users.delete(userId);
    mockDB.emailToUserId.delete(targetUser.email);
    mockDB.alarms.delete(userId);

    res.json({ success: true });
});

// Admin - Stats
app.get('/api/admin/stats', (req, res) => {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const tokenData = verifyToken(token);
    if (!tokenData) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    const user = mockDB.users.get(tokenData.userId);
    if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    let freeCount = 0;
    let premiumCount = 0;
    let adminCount = 0;

    for (const [_, userData] of mockDB.users.entries()) {
        if (userData.role === 'free') freeCount++;
        else if (userData.role === 'premium') premiumCount++;
        else if (userData.role === 'admin') adminCount++;
    }

    res.json({
        success: true,
        stats: {
            totalUsers: mockDB.users.size,
            freeUsers: freeCount,
            premiumUsers: premiumCount,
            adminUsers: adminCount
        }
    });
});

// ===== END MOCK AUTH API ENDPOINTS =====

// Main dashboard route
app.get('/tests', (req, res) => {
    res.sendFile(path.join(__dirname, 'tests', 'index.html'));
});

// Serve web app
app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'app.html'));
});

// Serve auth page
app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth.html'));
});

// Serve admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve alarm utils
app.get('/alarm-utils.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'alarm-utils.js'));
});

// API endpoint to list available videos
app.get('/api/videos', async (req, res) => {
    try {
        const outputDir = path.join(__dirname, 'test-results', 'playwright-output');

        // Check if directory exists
        try {
            await fs.access(outputDir);
        } catch {
            return res.json([]);
        }

        const files = await fs.readdir(outputDir);
        const videos = [];

        for (const file of files) {
            if (file.endsWith('.webm')) {
                const filePath = path.join(outputDir, file);
                const stats = await fs.stat(filePath);

                videos.push({
                    name: file.replace('.webm', '').replace(/-/g, ' '),
                    path: `/test-results/playwright-output/${file}`,
                    size: stats.size,
                    created: stats.mtime
                });
            }
        }

        // Sort by creation time, newest first
        videos.sort((a, b) => b.created - a.created);

        res.json(videos);
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});

// API endpoint to get test summary
app.get('/api/summary', async (req, res) => {
    try {
        const summary = {
            jest: null,
            playwright: null
        };

        // Try to read Jest results
        try {
            const jestData = await fs.readFile(
                path.join(__dirname, 'test-results', 'jest-results.json'),
                'utf8'
            );
            summary.jest = JSON.parse(jestData);
        } catch (error) {
            console.log('Jest results not available');
        }

        // Try to read Playwright results
        try {
            const playwrightData = await fs.readFile(
                path.join(__dirname, 'test-results', 'playwright-results.json'),
                'utf8'
            );
            summary.playwright = JSON.parse(playwrightData);
        } catch (error) {
            console.log('Playwright results not available');
        }

        res.json(summary);
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ error: 'Failed to fetch test summary' });
    }
});

// Root redirect
app.get('/', (req, res) => {
    res.redirect('/tests');
});

// Start server
app.listen(PORT, () => {
    console.log(`\n==============================================`);
    console.log(`Test Dashboard Server Running`);
    console.log(`==============================================`);
    console.log(`URL: http://localhost:${PORT}/tests`);
    console.log(`\nPress Ctrl+C to stop the server`);
    console.log(`==============================================\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    process.exit(0);
});
