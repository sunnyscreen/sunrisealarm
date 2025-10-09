const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from test-results directory
app.use('/test-results', express.static(path.join(__dirname, 'test-results')));

// Main dashboard route
app.get('/tests', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-dashboard.html'));
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
