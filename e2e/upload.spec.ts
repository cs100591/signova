import { test, expect } from '@playwright/test';

/**
 * Simplified Upload Tests
 * Tests: Page access, API auth
 * Note: Full upload flow requires authentication
 */
test.describe('Upload - Basic', () => {
  test('upload page should exist', async ({ page }) => {
    // Try to access upload page
    const response = await page.goto('/upload');
    
    // Should either show upload or redirect to login
    const currentUrl = page.url();
    
    // Either we're on upload page OR redirected to login
    expect(currentUrl.includes('/upload') || currentUrl.includes('/login')).toBeTruthy();
  });

  test('upload API should require auth or handle errors', async ({ page }) => {
    // Get the base URL from the page
    const baseUrl = await page.evaluate(() => window.location.origin);
    
    // Test API directly with full URL
    const response = await page.evaluate(async (baseUrl) => {
      try {
        // Create a simple FormData
        const formData = new FormData();
        formData.append('test', 'value');
        
        const res = await fetch(`${baseUrl}/api/upload`, {
          method: 'POST',
          body: formData
        });
        return { status: res.status };
      } catch (e) {
        return { status: 0, error: 'Network or CORS error' };
      }
    }, baseUrl);
    
    // Should return error (401, 400, 500) or 0 for network errors
    // The API may return different errors depending on implementation
    const validStatuses = [401, 400, 500, 0];
    expect(validStatuses).toContain(response.status);
  });

  test('confirm page should exist', async ({ page }) => {
    // Try to access confirm page
    const response = await page.goto('/confirm');
    
    // Page should load (though may show "no contract data" message)
    expect(response?.status()).toBe(200);
  });

  test('extracting page should exist', async ({ page }) => {
    // Try to access extracting page
    const response = await page.goto('/extracting');
    
    // Page should load
    expect(response?.status()).toBe(200);
  });
});
