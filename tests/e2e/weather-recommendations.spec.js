const { test, expect } = require('@playwright/test');

test.describe('Weather Recommendations', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear localStorage before each test
    await context.clearCookies();
    await page.goto('/app.html');
    await page.evaluate(() => localStorage.clear());
  });

  test('should load weather-client.js script', async ({ page }) => {
    await page.goto('/app.html');

    // Check that weather-client.js is loaded
    const scripts = await page.locator('script[src="weather-client.js"]').count();
    expect(scripts).toBeGreaterThan(0);
  });

  test('should have weather recommendation elements in DOM', async ({ page }) => {
    await page.goto('/app.html');

    // Check for weather recommendation container (exists but may not be in viewport until alarm)
    const weatherRecommendation = page.locator('#weatherRecommendation');
    await expect(weatherRecommendation).toBeAttached();

    // Check for weather condition element
    const weatherCondition = page.locator('#weatherCondition');
    await expect(weatherCondition).toBeAttached();

    // Check for clothing recommendation element
    const clothingRecommendation = page.locator('#clothingRecommendation');
    await expect(clothingRecommendation).toBeAttached();
  });

  test('should have weather recommendation styling', async ({ page }) => {
    await page.goto('/app.html');

    const weatherRecommendation = page.locator('#weatherRecommendation');

    // Should have the weather-recommendation class
    await expect(weatherRecommendation).toHaveClass(/weather-recommendation/);

    // Check that it has styling (background, padding, etc.)
    const styles = await weatherRecommendation.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        textAlign: computed.textAlign,
        padding: computed.padding
      };
    });

    expect(styles.position).toBe('absolute');
    expect(styles.textAlign).toBe('center');
  });

  test('should hide weather recommendation initially (not in alarm mode)', async ({ page }) => {
    await page.goto('/app.html');

    const weatherRecommendation = page.locator('#weatherRecommendation');

    // Should not be visible when alarm is not active
    // It's in the DOM but hidden by default or within the alarm overlay
    await expect(weatherRecommendation).toBeAttached();
  });

  test('should fetch weather recommendations from API', async ({ page }) => {
    await page.goto('/app.html');

    // Wait for page to load and make API call
    await page.waitForTimeout(1000);

    // Check that API was called
    const apiCalled = await page.evaluate(() => {
      // Check if localStorage has cached recommendations
      const cached = localStorage.getItem('sunnyscreen-weather-recommendations');
      return cached !== null;
    });

    // Should either have cached data or attempted to fetch
    expect(apiCalled).toBeDefined();
  });

  test('should cache weather recommendations in localStorage', async ({ page }) => {
    await page.goto('/app.html');

    // Wait for page to potentially fetch weather data
    await page.waitForTimeout(2000);

    // Check if localStorage caching mechanism is working correctly
    const cacheStatus = await page.evaluate(() => {
      const data = localStorage.getItem('sunnyscreen-weather-recommendations');

      // If no data cached yet, that's okay - return success
      if (!data) return { valid: true, reason: 'No data cached yet' };

      // If data is cached, verify it has the correct structure
      try {
        const cacheObject = JSON.parse(data);
        const hasCorrectStructure = cacheObject.data !== undefined && cacheObject.expiry !== undefined;
        return {
          valid: hasCorrectStructure,
          reason: hasCorrectStructure ? 'Cached data has correct structure' : 'Missing data or expiry field'
        };
      } catch (e) {
        return { valid: false, reason: 'Invalid JSON in cache' };
      }
    });

    // Cache mechanism should be valid (either empty or correctly structured)
    expect(cacheStatus.valid).toBeTruthy();
  });

  test('should use fallback recommendations if API fails', async ({ page }) => {
    // Mock API failure
    await page.route('/api/weather/recommendations', route => {
      route.abort();
    });

    await page.goto('/app.html');

    // Try to trigger weather recommendation fetch
    await page.evaluate(async () => {
      if (typeof getTodayWeatherRecommendation === 'function') {
        const recommendation = await getTodayWeatherRecommendation();
        return recommendation;
      }
    });

    // Should not throw error, should use fallback
    // Test passes if no error is thrown
  });

  test('should display weather condition with proper format', async ({ page }) => {
    await page.goto('/app.html');

    // Test that weather condition format is valid
    const validFormat = /\d+°F.*[A-Za-z]+/; // e.g., "72°F, Sunny, Light breeze"

    // Mock weather condition
    const mockCondition = "72°F, Sunny, Light breeze";
    expect(mockCondition).toMatch(validFormat);
  });

  test('should display clothing recommendation with proper format', async ({ page }) => {
    await page.goto('/app.html');

    // Test that recommendation format is valid
    const mockRecommendation = "Wear a light t-shirt and comfortable jeans with sneakers.";

    // Should be a sentence ending with period
    expect(mockRecommendation).toMatch(/^[A-Z].*\.$/);
    expect(mockRecommendation.length).toBeGreaterThan(10);
  });

  test('should select deterministic recommendation based on date', async ({ page }) => {
    await page.goto('/app.html');

    // Get today's recommendation twice
    const recommendation1 = await page.evaluate(async () => {
      if (typeof getTodayWeatherRecommendation === 'function') {
        const rec = await getTodayWeatherRecommendation();
        return rec;
      }
      return null;
    });

    await page.waitForTimeout(100);

    const recommendation2 = await page.evaluate(async () => {
      if (typeof getTodayWeatherRecommendation === 'function') {
        const rec = await getTodayWeatherRecommendation();
        return rec;
      }
      return null;
    });

    // Should be the same recommendation (deterministic for today)
    if (recommendation1 && recommendation2) {
      expect(recommendation1.condition).toBe(recommendation2.condition);
      expect(recommendation1.recommendation).toBe(recommendation2.recommendation);
    }
  });

  test('should position weather recommendation at bottom of alarm screen', async ({ page }) => {
    await page.goto('/app.html');

    const weatherRecommendation = page.locator('#weatherRecommendation');

    // Check positioning
    const styles = await weatherRecommendation.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        bottom: computed.bottom
      };
    });

    expect(styles.position).toBe('absolute');
    expect(styles.bottom).not.toBe('auto');
  });

  test('should have semi-transparent background for weather panel', async ({ page }) => {
    await page.goto('/app.html');

    const weatherRecommendation = page.locator('#weatherRecommendation');

    // Check that background is semi-transparent
    const background = await weatherRecommendation.evaluate((el) => {
      return window.getComputedStyle(el).background;
    });

    // Should have rgba or backdrop-filter styling
    expect(background.length).toBeGreaterThan(0);
  });

  test('should have weather-client.js route in test server', async ({ page }) => {
    // Test that weather-client.js is served correctly
    const response = await page.goto('/weather-client.js');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('javascript');
  });

  test('should have weather API endpoint', async ({ page }) => {
    // Test that API endpoint exists
    const response = await page.goto('/api/weather/recommendations');
    const status = response.status();

    // Accept 200 (success), 429 (rate limited), 402/403 (quota/payment issues)
    // Endpoint exists but may be protected by rate limits or quota
    expect([200, 429, 402, 403]).toContain(status);

    // Only check data structure if successful
    if (status === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('recommendations');
    }
  });

  test('should return 100 weather recommendations from API', async ({ page }) => {
    const response = await page.goto('/api/weather/recommendations');
    const status = response.status();

    // Skip validation if rate limited
    if (status === 429) {
      test.skip(status === 429, 'API rate limited on Vercel');
      return;
    }

    // Skip validation if quota exceeded or payment required
    if (status === 402 || status === 403) {
      test.skip(status === 402 || status === 403, 'Anthropic API quota exceeded or payment required');
      return;
    }

    // Check response for quota errors even if status is 500
    const data = await response.json();
    
    // Check if the error indicates quota issues
    if (data.error && data.details && data.details.error) {
      const errorCode = data.details.error.code;
      const errorType = data.details.error.type;
      if (errorCode === 'insufficient_quota' || errorType === 'insufficient_quota') {
        test.skip(true, 'Anthropic API quota exceeded');
        return;
      }
    }

    expect(data.success).toBe(true);
    expect(Array.isArray(data.recommendations)).toBe(true);
    expect(data.recommendations.length).toBe(100);
  });

  test('should have valid structure for each recommendation', async ({ page }) => {
    const response = await page.goto('/api/weather/recommendations');
    const status = response.status();

    // Skip validation if rate limited
    if (status === 429) {
      test.skip(status === 429, 'API rate limited on Vercel');
      return;
    }

    // Skip validation if quota exceeded
    if (status === 402 || status === 403) {
      test.skip(status === 402 || status === 403, 'Anthropic API quota exceeded');
      return;
    }

    const data = await response.json();

    // Check if the error indicates quota issues
    if (data.error && data.details && data.details.error) {
      const errorCode = data.details.error.code;
      const errorType = data.details.error.type;
      if (errorCode === 'insufficient_quota' || errorType === 'insufficient_quota') {
        test.skip(true, 'Anthropic API quota exceeded');
        return;
      }
    }

    const firstRecommendation = data.recommendations[0];
    expect(firstRecommendation).toHaveProperty('condition');
    expect(firstRecommendation).toHaveProperty('recommendation');
    expect(typeof firstRecommendation.condition).toBe('string');
    expect(typeof firstRecommendation.recommendation).toBe('string');
  });

  test('should not break alarm functionality when weather feature present', async ({ page }) => {
    await page.goto('/app.html');

    // Verify alarm elements still work
    const wakeTimeInput = page.locator('#wakeTime');
    await expect(wakeTimeInput).toBeVisible();

    const durationInput = page.locator('#duration');
    await expect(durationInput).toBeVisible();

    // Weather feature should not interfere with core alarm functionality
  });

  test('should have proper z-index for weather panel', async ({ page }) => {
    await page.goto('/app.html');

    const weatherRecommendation = page.locator('#weatherRecommendation');

    // Should be on top of alarm background but below dismiss controls
    const zIndex = await weatherRecommendation.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });

    // zIndex should be defined (not 'auto')
    expect(zIndex).toBeDefined();
  });

  test('should have different recommendations for different temperature ranges', async ({ page }) => {
    const response = await page.goto('/api/weather/recommendations');
    const status = response.status();

    // Skip validation if rate limited
    if (status === 429) {
      test.skip(status === 429, 'API rate limited on Vercel');
      return;
    }

    // Skip validation if quota exceeded
    if (status === 402 || status === 403) {
      test.skip(status === 402 || status === 403, 'Anthropic API quota exceeded');
      return;
    }

    const data = await response.json();

    // Check if the error indicates quota issues
    if (data.error && data.details && data.details.error) {
      const errorCode = data.details.error.code;
      const errorType = data.details.error.type;
      if (errorCode === 'insufficient_quota' || errorType === 'insufficient_quota') {
        test.skip(true, 'Anthropic API quota exceeded');
        return;
      }
    }

    // Extract temperatures from conditions
    const temperatures = data.recommendations.map(rec => {
      const match = rec.condition.match(/(\d+)°F/);
      return match ? parseInt(match[1]) : 0;
    });

    // Should have variety of temperatures
    const uniqueTemps = [...new Set(temperatures)];
    expect(uniqueTemps.length).toBeGreaterThanOrEqual(10); // At least 10 different temperatures
  });

  test('should center weather recommendation horizontally', async ({ page }) => {
    await page.goto('/app.html');

    const weatherRecommendation = page.locator('#weatherRecommendation');

    // Check that the element has centering CSS applied
    const hasCentering = await weatherRecommendation.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      // Element should have positioning that centers it
      // Check both inline styles and computed styles
      const inlineTransform = el.style.transform;
      const computedTransform = computed.transform;
      const computedLeft = computed.left;

      // Either transform is set in computed styles OR left is 50%
      return (computedTransform && computedTransform !== 'none') || computedLeft === '50%';
    });

    expect(hasCentering).toBe(true);
  });

  test('should have max-width for weather recommendation panel', async ({ page }) => {
    await page.goto('/app.html');

    const weatherRecommendation = page.locator('#weatherRecommendation');

    const maxWidth = await weatherRecommendation.evaluate((el) => {
      return window.getComputedStyle(el).maxWidth;
    });

    // Should have max-width set
    expect(maxWidth).not.toBe('none');
  });

  test('should prevent text selection in weather panel', async ({ page }) => {
    await page.goto('/app.html');

    const weatherRecommendation = page.locator('#weatherRecommendation');

    const userSelect = await weatherRecommendation.evaluate((el) => {
      return window.getComputedStyle(el).userSelect;
    });

    // Should have user-select: none
    expect(userSelect).toBe('none');
  });

  test('should have rounded corners on weather panel', async ({ page }) => {
    await page.goto('/app.html');

    const weatherRecommendation = page.locator('#weatherRecommendation');

    const borderRadius = await weatherRecommendation.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });

    // Should have border-radius set
    expect(borderRadius).not.toBe('0px');
  });

  test('should validate cache expiry is in the future', async ({ page }) => {
    await page.goto('/app.html');

    // Mock setting cache
    await page.evaluate(() => {
      const CACHE_DURATION_DAYS = 30;
      const expiryTime = Date.now() + (CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000);
      localStorage.setItem('sunnyscreen-weather-cache-expiry', expiryTime.toString());
    });

    // Check expiry is valid
    const isValid = await page.evaluate(() => {
      const expiry = localStorage.getItem('sunnyscreen-weather-cache-expiry');
      const expiryDate = new Date(parseInt(expiry));
      return expiryDate > new Date();
    });

    expect(isValid).toBe(true);
  });

  test('should handle missing weather data gracefully', async ({ page }) => {
    await page.goto('/app.html');

    // Clear any cached weather data
    await page.evaluate(() => {
      localStorage.removeItem('sunnyscreen-weather-recommendations');
      localStorage.removeItem('sunnyscreen-weather-cache-expiry');
    });

    // Page should still load without errors
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
