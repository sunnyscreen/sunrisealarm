# GitHub Secrets Setup

This document explains how to configure the required secrets for CI/CD workflows.

## Required Secrets

### ANTHROPIC_API_KEY (Optional but Recommended)

**Purpose:** Enables AI-powered test failure analysis using Claude API

**Without it:**
- Test failure analyzer still works
- Uses pattern-based analysis (less detailed)

**With it:**
- Advanced root cause analysis
- Context-aware recommendations
- Specific code change suggestions

**How to add:**

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `ANTHROPIC_API_KEY`
5. Value: Your Anthropic API key (starts with `sk-ant-...`)
6. Click **Add secret**

**Get an API key:**
- Visit https://console.anthropic.com/
- Sign up or log in
- Go to **API Keys** section
- Create a new key

### Other Secrets (Already Configured)

These should already be set up:

- `GITHUB_TOKEN` - Auto-provided by GitHub Actions
- `VERCEL_AUTOMATION_BYPASS_SECRET` - For accessing Vercel preview deployments
- `SEED_SECRET` - For seeding test users in deployed environments

## Testing the Setup

After adding `ANTHROPIC_API_KEY`:

1. Create a branch that will cause tests to fail (e.g., change UI text without updating tests)
2. Push to a branch and create a PR
3. Wait for tests to fail
4. Check the PR comments - you should see detailed AI analysis
5. Visit `/tests` on the preview deployment to see the analysis there too

## Troubleshooting

**"No analysis generated"**
- Check the workflow logs in Actions tab
- Verify the secret name is exactly `ANTHROPIC_API_KEY`
- Ensure your API key is valid and has credits

**"Using local pattern-based analysis"**
- This message in logs means the API key wasn't found
- The analyzer still works, just with simpler recommendations
