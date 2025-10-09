const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create test-results directory if it doesn't exist
const testResultsDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
}

// Get additional arguments passed to the script
const additionalArgs = process.argv.slice(2).join(' ');
const jestCommand = `jest --json --outputFile=test-results/jest-results.json ${additionalArgs}`.trim();

try {
    // Run Jest with JSON output and any additional arguments
    const output = execSync(jestCommand, {
        encoding: 'utf8',
        stdio: ['inherit', 'pipe', 'pipe']
    });

    console.log(output);
    console.log('\n✓ Test results saved to test-results/jest-results.json');
    process.exit(0);
} catch (error) {
    // Jest exits with code 1 if tests fail, but we still want the JSON output
    if (error.stdout) {
        console.log(error.stdout);
    }
    if (error.stderr) {
        console.error(error.stderr);
    }

    // Check if JSON file was created
    const jsonPath = path.join(testResultsDir, 'jest-results.json');
    if (fs.existsSync(jsonPath)) {
        console.log('\n✓ Test results saved to test-results/jest-results.json');
    }

    process.exit(error.status || 1);
}
