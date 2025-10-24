#!/usr/bin/env node

/**
 * Analyzes test failures and generates recommendations using Claude API
 * Reads playwright-results.json and generates a markdown report with fix suggestions
 */

const fs = require('fs');
const path = require('path');

// Check if Anthropic API key is available
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const USE_CLAUDE = ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'undefined';

async function analyzeWithClaude(failures) {
  if (!USE_CLAUDE) {
    return null;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `You are a test failure analyzer. Analyze these test failures and provide specific, actionable recommendations for fixes.

For each failure, provide:
1. Root cause analysis
2. Specific code changes needed
3. File and line numbers if identifiable

Test Failures:
${JSON.stringify(failures, null, 2)}

Format your response as markdown with clear sections for each failed test.`
        }]
      })
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return null;
  }
}

function analyzeFailuresLocally(failures) {
  let analysis = '';

  failures.forEach((failure, index) => {
    analysis += `### ${index + 1}. ${failure.title}\n\n`;
    analysis += `**File:** \`${failure.file}\`\n\n`;
    analysis += `**Error:**\n\`\`\`\n${failure.error}\n\`\`\`\n\n`;

    // Provide basic recommendations based on error patterns
    if (failure.error.includes('Timeout')) {
      analysis += `**💡 Recommendation:**\n`;
      analysis += `- The test is timing out while waiting for an element or action\n`;
      analysis += `- Check if the selector \`${extractSelector(failure.error)}\` exists in the DOM\n`;
      analysis += `- Consider increasing timeout or checking if page is loading correctly\n`;
      analysis += `- Review recent changes to the page structure\n\n`;
    } else if (failure.error.includes('toContainText')) {
      const expected = extractExpectedText(failure.error);
      const received = extractReceivedText(failure.error);
      analysis += `**💡 Recommendation:**\n`;
      analysis += `- Expected text: \`${expected}\`\n`;
      analysis += `- Actual text: \`${received}\`\n`;
      analysis += `- Update the test expectation if the text change is intentional\n`;
      analysis += `- If unintentional, restore the original text in the source code\n\n`;
    } else if (failure.error.includes('toBeVisible')) {
      analysis += `**💡 Recommendation:**\n`;
      analysis += `- The expected element is not visible on the page\n`;
      analysis += `- Check if the element was removed or CSS display property changed\n`;
      analysis += `- Update the test if the UI change is intentional\n\n`;
    } else if (failure.error.includes('toBe')) {
      analysis += `**💡 Recommendation:**\n`;
      analysis += `- Value mismatch detected\n`;
      analysis += `- Review if the change in behavior is intentional\n`;
      analysis += `- Update test expectation if behavior change is correct\n\n`;
    } else {
      analysis += `**💡 Recommendation:**\n`;
      analysis += `- Review the error message above for specific details\n`;
      analysis += `- Check recent code changes that might have affected this test\n`;
      analysis += `- Consider if the test expectations need updating\n\n`;
    }

    if (failure.attachments && failure.attachments.length > 0) {
      analysis += `**📎 Attachments:**\n`;
      failure.attachments.forEach(att => {
        if (att.includes('screenshot')) {
          analysis += `- 🖼️ Screenshot: Check the visual state when the test failed\n`;
        } else if (att.includes('video')) {
          analysis += `- 🎥 Video: Watch the test execution to see what happened\n`;
        }
      });
      analysis += `\n`;
    }

    analysis += `---\n\n`;
  });

  return analysis;
}

function extractSelector(errorText) {
  const match = errorText.match(/locator\(['"]([^'"]+)['"]\)/);
  return match ? match[1] : 'unknown';
}

function extractExpectedText(errorText) {
  const match = errorText.match(/Expected substring:\s*["'](.+?)["']/);
  return match ? match[1] : 'unknown';
}

function extractReceivedText(errorText) {
  const match = errorText.match(/Received string:\s*["'](.+?)["']/);
  return match ? match[1] : 'unknown';
}

async function main() {
  console.log('🔍 Analyzing test failures...');

  const resultsPath = path.join(process.cwd(), 'test-results', 'playwright-results.json');

  if (!fs.existsSync(resultsPath)) {
    console.log('⚠️  No test results found at:', resultsPath);
    const fallbackAnalysis = `## No Test Results Available

Could not find test results file at \`test-results/playwright-results.json\`.

This might mean:
- Tests did not generate a results file
- Test artifacts were not downloaded correctly
- Tests failed before completion

Please check the workflow logs for more details.`;

    fs.writeFileSync(
      path.join(process.cwd(), 'test-results', 'failure-analysis.md'),
      fallbackAnalysis
    );
    return;
  }

  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

  // Extract failed tests
  const failures = [];

  if (results.suites) {
    results.suites.forEach(suite => {
      if (suite.specs) {
        suite.specs.forEach(spec => {
          if (spec.tests) {
            spec.tests.forEach(test => {
              if (test.results) {
                test.results.forEach(result => {
                  if (result.status === 'failed' || result.status === 'timedOut') {
                    failures.push({
                      title: spec.title,
                      file: spec.file,
                      error: result.error?.message || 'Unknown error',
                      status: result.status,
                      duration: result.duration,
                      attachments: result.attachments?.map(a => a.path) || []
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  if (failures.length === 0) {
    console.log('✅ No failures found in test results');
    const noFailureAnalysis = `## ✅ All Tests Passed

No test failures detected in the results file.`;
    fs.writeFileSync(
      path.join(process.cwd(), 'test-results', 'failure-analysis.md'),
      noFailureAnalysis
    );
    return;
  }

  console.log(`Found ${failures.length} failed test(s)`);

  // Generate analysis
  let analysis = `## Test Failure Summary\n\n`;
  analysis += `**Total Failures:** ${failures.length}\n\n`;

  // Try Claude analysis first, fall back to local analysis
  if (USE_CLAUDE) {
    console.log('🤖 Using Claude API for advanced analysis...');
    const claudeAnalysis = await analyzeWithClaude(failures);
    if (claudeAnalysis) {
      analysis += claudeAnalysis;
    } else {
      console.log('⚠️  Claude API unavailable, using local analysis');
      analysis += analyzeFailuresLocally(failures);
    }
  } else {
    console.log('📊 Using local pattern-based analysis (set ANTHROPIC_API_KEY for AI analysis)');
    analysis += analyzeFailuresLocally(failures);
  }

  // Add footer with tips
  analysis += `\n## 💡 General Tips\n\n`;
  analysis += `- Check recent commits that might have changed the UI or behavior\n`;
  analysis += `- Review screenshots and videos in the test artifacts\n`;
  analysis += `- Run tests locally with \`npm run test:e2e\` to debug\n`;
  analysis += `- Use \`npx playwright test --debug\` for step-by-step debugging\n`;

  // Save analysis
  const outputPath = path.join(process.cwd(), 'test-results', 'failure-analysis.md');
  fs.writeFileSync(outputPath, analysis);

  console.log('✅ Analysis complete, saved to:', outputPath);
  console.log('\nSummary:');
  console.log(`- ${failures.length} test(s) failed`);
  console.log(`- Analysis method: ${USE_CLAUDE ? 'Claude API' : 'Local pattern-based'}`);
}

main().catch(error => {
  console.error('Error during analysis:', error);
  process.exit(1);
});
