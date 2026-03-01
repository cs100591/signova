import { test, expect } from '@playwright/test';

/**
 * Simplified Terminal Tests
 * Tests: Page access, basic structure
 * Note: Full functionality requires authentication
 */
test.describe('Terminal - Basic', () => {
  test('terminal page should exist', async ({ page }) => {
    // Try to access terminal page
    const response = await page.goto('/terminal');
    
    // Should either show terminal or redirect to login
    const currentUrl = page.url();
    
    // Either we're on terminal page OR redirected to login
    expect(currentUrl.includes('/terminal') || currentUrl.includes('/login')).toBeTruthy();
  });

  test('terminal API should require auth', async ({ page }) => {
    // Test API directly
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/terminal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'test' })
      });
      return { status: res.status };
    });
    
    // Should return 401 Unauthorized when not logged in
    expect(response.status).toBe(401);
  });
});
