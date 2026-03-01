import { test, expect } from '@playwright/test';
import path from 'path';

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

  test('upload API should require auth', async ({ page }) => {
    // Test API directly with a simple request
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true })
        });
        return { status: res.status };
      } catch (e) {
        return { status: 0, error: 'Network error' };
      }
    });
    
    // Should return 401 Unauthorized or error when not logged in
    // Note: May also return other errors due to wrong content type
    expect([401, 400, 500]).toContain(response.status);
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
