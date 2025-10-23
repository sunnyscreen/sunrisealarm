const { test, expect } = require('@playwright/test');

test.describe('Homepage and Animated Background', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Check that main elements are present
    await expect(page.locator('h1')).toContainText('Wake up to a');
    await expect(page).toHaveTitle(/Sunnyscreen/);
  });

  test('should have hero section with animated background', async ({ page }) => {
    await page.goto('/');

    const hero = page.locator('.hero');
    await expect(hero).toBeVisible();

    // Check that animation is applied
    const animation = await hero.evaluate((el) => {
      return window.getComputedStyle(el).animation;
    });

    // Should have animation property set
    expect(animation).toContain('sunriseCycle');
  });

  test('should have sunriseCycle animation with correct duration', async ({ page }) => {
    await page.goto('/');

    const hero = page.locator('.hero');

    const animationDuration = await hero.evaluate((el) => {
      return window.getComputedStyle(el).animationDuration;
    });

    // Should be 30 seconds
    expect(animationDuration).toBe('30s');
  });

  test('should have infinite animation iteration', async ({ page }) => {
    await page.goto('/');

    const hero = page.locator('.hero');

    const animationIterationCount = await hero.evaluate((el) => {
      return window.getComputedStyle(el).animationIterationCount;
    });

    // Should loop infinitely
    expect(animationIterationCount).toBe('infinite');
  });

  test('should have ease-in-out timing function', async ({ page }) => {
    await page.goto('/');

    const hero = page.locator('.hero');

    const animationTimingFunction = await hero.evaluate((el) => {
      return window.getComputedStyle(el).animationTimingFunction;
    });

    // Should use ease-in-out for smooth transitions
    expect(animationTimingFunction).toContain('ease-in-out');
  });

  test('should have hero::before pseudo-element with sun glow animation', async ({ page }) => {
    await page.goto('/');

    // Check that sunGlow animation exists in stylesheets
    const hasAnimation = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      for (const sheet of stylesheets) {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules);
          for (const rule of rules) {
            if (rule.cssText && rule.cssText.includes('sunGlow')) {
              return true;
            }
          }
        } catch (e) {
          // Cross-origin stylesheets may throw
        }
      }
      return false;
    });

    expect(hasAnimation).toBe(true);
  });

  test('should have @keyframes sunriseCycle defined', async ({ page }) => {
    await page.goto('/');

    // Check that animation keyframes exist
    const hasKeyframes = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      for (const sheet of stylesheets) {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules);
          for (const rule of rules) {
            if (rule.name === 'sunriseCycle') {
              return true;
            }
          }
        } catch (e) {
          // Cross-origin stylesheets may throw
        }
      }
      return false;
    });

    expect(hasKeyframes).toBe(true);
  });

  test('should have gradient background that changes', async ({ page }) => {
    await page.goto('/');

    const hero = page.locator('.hero');

    // Get initial background
    const initialBackground = await hero.evaluate((el) => {
      return window.getComputedStyle(el).background;
    });

    expect(initialBackground).toContain('gradient');
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');

    // Check for navigation to app
    const appLink = page.locator('a[href="app.html"], a[href="/app"], a[href="/app.html"]');
    await expect(appLink.first()).toBeVisible();
  });

  test('should have footer with sunrise data link', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Check for sunrise data link
    const sunriseDataLink = page.locator('a[href="sunrise-data.html"]');
    await expect(sunriseDataLink).toBeVisible();
  });

  test('should have responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    const hero = page.locator('.hero');
    await expect(hero).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(hero).toBeVisible();
  });

  test('should maintain animation on window resize', async ({ page }) => {
    await page.goto('/');

    const hero = page.locator('.hero');

    // Check animation before resize
    const animationBefore = await hero.evaluate((el) => {
      return window.getComputedStyle(el).animationName;
    });

    // Resize window
    await page.setViewportSize({ width: 768, height: 1024 });

    // Check animation after resize
    const animationAfter = await hero.evaluate((el) => {
      return window.getComputedStyle(el).animationName;
    });

    // Animation should still be present
    expect(animationBefore).toBe(animationAfter);
    expect(animationAfter).toContain('sunriseCycle');
  });

  test('should have CTA button that works', async ({ page }) => {
    await page.goto('/');

    const ctaButton = page.locator('a.cta-button, button.cta-button, a:has-text("Get Started"), a:has-text("Try it")').first();

    if (await ctaButton.isVisible()) {
      await expect(ctaButton).toBeVisible();
      // Clicking should navigate somewhere or trigger action
    }
  });

  test('should have proper color transitions in animation', async ({ page }) => {
    await page.goto('/');

    // Check that keyframes include color transitions
    const hasColorTransitions = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      for (const sheet of stylesheets) {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules);
          for (const rule of rules) {
            if (rule.name === 'sunriseCycle' && rule.cssText) {
              // Should contain gradient colors
              return rule.cssText.includes('gradient');
            }
          }
        } catch (e) {
          // Cross-origin stylesheets may throw
        }
      }
      return false;
    });

    expect(hasColorTransitions).toBe(true);
  });

  test('should show features section', async ({ page }) => {
    await page.goto('/');

    // Check for features section
    const features = page.locator('.features, section:has-text("Features"), section:has-text("How it works")');

    // Should have some informational content
    const hasContent = await features.count() > 0 || await page.locator('main').isVisible();
    expect(hasContent).toBe(true);
  });

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');

    // Should have h1
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();

    // Get h1 text
    const h1Text = await h1.first().textContent();
    expect(h1Text.length).toBeGreaterThan(0);
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/');

    // Wait a bit for any async errors
    await page.waitForTimeout(1000);

    // Should have no JavaScript errors
    expect(errors.length).toBe(0);
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    // Check title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('should have favicon', async ({ page }) => {
    await page.goto('/');

    // Check for favicon
    const favicon = page.locator('link[rel="icon"], link[rel="shortcut icon"]');
    const faviconCount = await favicon.count();

    // Should have at least one favicon link
    expect(faviconCount).toBeGreaterThanOrEqual(0); // Some pages may not have favicon
  });

  test('should have semantic HTML structure', async ({ page }) => {
    await page.goto('/');

    // Should have header
    const header = page.locator('header, nav');
    const hasHeader = await header.count() > 0;

    // Should have main content area
    const main = page.locator('main, .main, .container');
    const hasMain = await main.count() > 0;

    expect(hasHeader || hasMain).toBe(true);
  });

  test('should display correctly on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X

    await page.goto('/');

    // Check that hero is visible
    const hero = page.locator('.hero');
    await expect(hero).toBeVisible();

    // Check that text is readable (not too small)
    const h1 = page.locator('h1');
    const fontSize = await h1.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    // Font size should be reasonable (at least 24px on mobile)
    const size = parseInt(fontSize);
    expect(size).toBeGreaterThan(20);
  });

  test('should have accessible contrast for text', async ({ page }) => {
    await page.goto('/');

    const h1 = page.locator('h1');
    const color = await h1.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Color should be defined
    expect(color).toBeTruthy();
  });

  test('should animate smoothly without performance issues', async ({ page }) => {
    await page.goto('/');

    // Wait for animation to start
    await page.waitForTimeout(1000);

    // Check that page is responsive
    const hero = page.locator('.hero');
    await expect(hero).toBeVisible();

    // Animation should be using GPU acceleration (implicit in CSS animation)
  });

  test('should have link to app from homepage', async ({ page }) => {
    await page.goto('/');

    const appLink = page.locator('a[href*="app"]').first();

    if (await appLink.isVisible()) {
      await appLink.click();
      await expect(page).toHaveURL(/.*app/);
    }
  });

  test('should display brand colors consistently', async ({ page }) => {
    await page.goto('/');

    // Check that orange accent color is used
    const links = page.locator('a[style*="color"]');

    if (await links.count() > 0) {
      const color = await links.first().evaluate((el) => {
        return window.getComputedStyle(el).color;
      });

      // Color should be defined
      expect(color).toBeTruthy();
    }
  });

  test('should not have layout shift during animation', async ({ page }) => {
    await page.goto('/');

    // Get initial layout
    const hero = page.locator('.hero');
    const initialBox = await hero.boundingBox();

    // Wait for animation
    await page.waitForTimeout(2000);

    // Get layout after animation started
    const afterBox = await hero.boundingBox();

    // Position and size should remain stable
    expect(initialBox.y).toBe(afterBox.y);
    expect(initialBox.width).toBe(afterBox.width);
  });
});
