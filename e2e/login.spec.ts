import { test, expect } from '@playwright/test';

/**
 * Simplified Login Flow Tests
 * Tests basic login page functionality
 */
test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Check page loaded
    await expect(page).toHaveURL(/.*login.*/);
    
    // Check for login form elements - use more specific selectors
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    
    // Check for submit button specifically in the form
    await expect(page.locator('form button[type="submit"]')).toBeVisible();
  });

  test('should toggle between login and signup', async ({ page }) => {
    // First verify we're on login view
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    
    // Click create account tab (first button with this text in the toggle)
    await page.locator('button', { hasText: /create account/i }).first().click();
    
    // Check signup form appears - look for unique signup elements
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    
    // Should have confirm password field
    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs).toHaveCount(2); // Password + Confirm Password
  });

  test('should have email and password fields required', async ({ page }) => {
    const emailInput = page.getByPlaceholder(/you@example.com/i);
    const passwordInput = page.locator('input[type="password"]').first();
    
    // Check HTML5 validation attributes
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('should navigate to home when clicking logo', async ({ page }) => {
    // Click the Signova logo/link
    await page.getByRole('link', { name: /signova/i }).first().click();
    
    // Should navigate to home
    await page.waitForURL('/', { timeout: 5000 });
    await expect(page).toHaveURL('/');
  });
});
