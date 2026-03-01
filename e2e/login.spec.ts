import { test, expect } from '@playwright/test';

/**
 * Login Flow Tests
 * Tests: Authentication, session persistence
 */
test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Check for login form elements
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/••••••••/)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should toggle between login and signup', async ({ page }) => {
    // Click create account
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Check signup form appears
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Check HTML5 validation (browser prevents submission)
    const emailInput = page.getByPlaceholder(/you@example.com/i);
    await expect(emailInput).toHaveAttribute('required');
  });

  test('should persist session after login', async ({ page }) => {
    // Note: This test requires valid credentials
    // Skip if no test credentials provided
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;
    
    if (!testEmail || !testPassword) {
      test.skip('No test credentials provided');
      return;
    }

    // Fill login form
    await page.getByPlaceholder(/you@example.com/i).fill(testEmail);
    await page.getByPlaceholder(/••••••••/).fill(testPassword);
    
    // Submit
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for redirect
    await page.waitForURL('**/contracts**', { timeout: 10000 });
    
    // Verify logged in by checking dashboard
    await expect(page.getByRole('heading', { name: /contracts/i })).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Should still be on contracts page (session persisted)
    await expect(page.getByRole('heading', { name: /contracts/i })).toBeVisible();
  });

  test('should redirect authenticated users away from login', async ({ page, context }) => {
    // This test assumes user is already logged in
    // Navigate to login while authenticated
    
    // First, check if we can access contracts (meaning we're logged in)
    await page.goto('/contracts');
    
    // If redirected to login, skip this test
    if (page.url().includes('/login')) {
      test.skip('User not authenticated');
      return;
    }
    
    // Try to navigate to login
    await page.goto('/login');
    
    // Should redirect to contracts
    await page.waitForURL('**/contracts**', { timeout: 5000 });
  });
});
