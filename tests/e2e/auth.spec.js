const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies and localStorage before each test
    await context.clearCookies();
    await page.goto('/app');
    await page.evaluate(() => localStorage.clear());
  });

  test('should show sign in link for unauthenticated users', async ({ page }) => {
    await page.goto('/app');

    // Should show "Sign in" link at bottom
    const authLink = page.locator('#authLink');
    await expect(authLink).toBeVisible();
    await expect(authLink).toHaveText('Sign in');

    // Should show "Login / Signup" button
    const loginBtn = page.locator('#loginBtn');
    await expect(loginBtn).toBeVisible();

    // Should NOT show logout or admin buttons
    const logoutBtn = page.locator('#logoutBtn');
    const adminBtn = page.locator('#adminBtn');
    await expect(logoutBtn).not.toBeVisible();
    await expect(adminBtn).not.toBeVisible();
  });

  test('should navigate to auth page when clicking sign in link', async ({ page }) => {
    await page.goto('/app');

    const authLink = page.locator('#authLink');
    await authLink.click();

    // Should navigate to auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should navigate to auth page when clicking login button', async ({ page }) => {
    await page.goto('/app');

    const loginBtn = page.locator('#loginBtn');
    await loginBtn.click();

    // Should navigate to auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should allow user to register a new account', async ({ page }) => {
    await page.goto('/auth');

    // Click Sign Up tab
    const signupTab = page.locator('button[data-form="signup"]');
    await signupTab.click();

    // Fill in registration form
    const testEmail = `test${Date.now()}@example.com`;
    await page.locator('#signupEmail').fill(testEmail);
    await page.locator('#signupPassword').fill('password123');
    await page.locator('#signupPasswordConfirm').fill('password123');

    // Submit form
    const signupBtn = page.locator('#signupBtn');
    await signupBtn.click();

    // Should redirect to app page after successful signup
    await expect(page).toHaveURL(/\/app/, { timeout: 5000 });

    // Should show user as logged in
    const authLink = page.locator('#authLink');
    await expect(authLink).toContainText(`Sign out ${testEmail}`);
  });

  test('should allow user to login with existing account', async ({ page }) => {
    await page.goto('/auth');

    // Login tab should be active by default
    const loginTab = page.locator('button[data-form="login"]');
    await expect(loginTab).toHaveClass(/active/);

    // Fill in login form with test user
    await page.locator('#loginEmail').fill('user@test.com');
    await page.locator('#loginPassword').fill('anypassword'); // Mock accepts any password

    // Submit form
    const loginBtn = page.locator('#loginBtn');
    await loginBtn.click();

    // Should redirect to app page
    await expect(page).toHaveURL(/\/app/, { timeout: 5000 });

    // Should show user as logged in
    const authLink = page.locator('#authLink');
    await expect(authLink).toContainText('Sign out user@test.com');
  });

  test('should show admin button for admin users', async ({ page }) => {
    await page.goto('/auth');

    // Login as admin
    await page.locator('#loginEmail').fill('admin@test.com');
    await page.locator('#loginPassword').fill('password');
    await page.locator('#loginBtn').click();

    // Wait for redirect
    await expect(page).toHaveURL(/\/app/, { timeout: 5000 });

    // Admin button should be visible
    const adminBtn = page.locator('#adminBtn');
    await expect(adminBtn).toBeVisible();

    // User info should show admin role
    const userInfo = page.locator('#userInfo');
    await expect(userInfo).toContainText('admin');
    await expect(userInfo).toContainText('admin@test.com');
  });

  test('should persist auth state after page reload', async ({ page }) => {
    await page.goto('/auth');

    // Login
    await page.locator('#loginEmail').fill('user@test.com');
    await page.locator('#loginPassword').fill('password');
    await page.locator('#loginBtn').click();

    await expect(page).toHaveURL(/\/app/, { timeout: 5000 });

    // Reload page
    await page.reload();

    // Should still be logged in
    const authLink = page.locator('#authLink');
    await expect(authLink).toContainText('Sign out user@test.com');
  });

  test('should allow user to logout', async ({ page }) => {
    await page.goto('/auth');

    // Login first
    await page.locator('#loginEmail').fill('user@test.com');
    await page.locator('#loginPassword').fill('password');
    await page.locator('#loginBtn').click();

    await expect(page).toHaveURL(/\/app/, { timeout: 5000 });

    // Click sign out link
    const authLink = page.locator('#authLink');
    await authLink.click();

    // Should redirect to auth page
    await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });

    // Navigate back to app
    await page.goto('/app');

    // Should show sign in link (not signed in)
    await expect(authLink).toHaveText('Sign in');
  });

  test('should sync alarm configuration to cloud for authenticated users', async ({ page }) => {
    await page.goto('/auth');

    // Login
    await page.locator('#loginEmail').fill('user@test.com');
    await page.locator('#loginPassword').fill('password');
    await page.locator('#loginBtn').click();

    await expect(page).toHaveURL(/\/app/, { timeout: 5000 });

    // Change alarm configuration
    await page.locator('#wakeTime').fill('08:00');
    await page.locator('#duration').fill('45');
    await page.waitForTimeout(1000); // Wait for save

    // Reload page
    await page.reload();

    // Configuration should persist (loaded from cloud)
    await expect(page.locator('#wakeTime')).toHaveValue('08:00');
    await expect(page.locator('#duration')).toHaveValue('45');
  });

  test('should access admin panel as admin user', async ({ page }) => {
    await page.goto('/auth');

    // Login as admin
    await page.locator('#loginEmail').fill('admin@test.com');
    await page.locator('#loginPassword').fill('password');
    await page.locator('#loginBtn').click();

    await expect(page).toHaveURL(/\/app/, { timeout: 5000 });

    // Click admin button
    const adminBtn = page.locator('#adminBtn');
    await adminBtn.click();

    // Should navigate to admin page
    await expect(page).toHaveURL(/\/admin/, { timeout: 5000 });

    // Should show admin dashboard
    await expect(page.locator('h1')).toContainText('Admin');
  });

  test('should show user info for authenticated users', async ({ page }) => {
    await page.goto('/auth');

    // Login
    await page.locator('#loginEmail').fill('user@test.com');
    await page.locator('#loginPassword').fill('password');
    await page.locator('#loginBtn').click();

    await expect(page).toHaveURL(/\/app/, { timeout: 5000 });

    // User info should be visible
    const userInfo = page.locator('#userInfo');
    await expect(userInfo).toBeVisible();
    await expect(userInfo).toContainText('user@test.com');
    await expect(userInfo).toContainText('free');
  });

  test('should show local storage message for unauthenticated users', async ({ page }) => {
    await page.goto('/app');

    const userInfo = page.locator('#userInfo');
    await expect(userInfo).toBeVisible();
    await expect(userInfo).toContainText('Using local storage (not synced)');
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/auth');

    // Try to login with invalid email
    await page.locator('#loginEmail').fill('nonexistent@test.com');
    await page.locator('#loginPassword').fill('password');
    await page.locator('#loginBtn').click();

    // Wait a bit for error
    await page.waitForTimeout(1000);

    // Should stay on auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should prevent duplicate registration', async ({ page }) => {
    await page.goto('/auth');

    // Click Sign Up tab
    const signupTab = page.locator('button[data-form="signup"]');
    await signupTab.click();

    // Try to register with existing email
    await page.locator('#signupEmail').fill('user@test.com');
    await page.locator('#signupPassword').fill('password123');
    await page.locator('#signupPasswordConfirm').fill('password123');
    await page.locator('#signupBtn').click();

    // Wait for error
    await page.waitForTimeout(1000);

    // Should stay on auth page
    await expect(page).toHaveURL(/\/auth/);
  });
});
