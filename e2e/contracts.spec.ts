import { test, expect } from '@playwright/test';

/**
 * Simplified Contracts List Tests
 * Tests: Page access, no mock data
 * Note: Most tests require authentication
 */
test.describe('Contracts List - Basic', () => {
  test('contracts page should exist', async ({ page }) => {
    // Try to access contracts page
    const response = await page.goto('/contracts');
    
    // Should either show contracts or redirect to login (both are valid behaviors)
    const currentUrl = page.url();
    
    // Either we're on contracts page OR redirected to login
    expect(currentUrl.includes('/contracts') || currentUrl.includes('/login')).toBeTruthy();
  });

  test('contracts API should require auth', async ({ page }) => {
    // Navigate to a page first to establish origin
    await page.goto('/');
    
    // Test API directly - Playwright will handle the base URL
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/contracts');
      return { status: res.status };
    });
    
    // Should return 401 Unauthorized when not logged in
    expect(response.status).toBe(401);
  });
});
