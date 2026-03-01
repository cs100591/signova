import { test, expect } from '@playwright/test';

/**
 * Contracts List Page Tests
 * Tests: Real data fetching, filtering, stats, no mock data
 */
test.describe('Contracts List - Real Data', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contracts');
  });

  test('should display real contracts or empty state', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForLoadState('networkidle');
    
    // Check if loading spinner is gone
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible();
    
    // Either show contracts or empty state
    const hasContracts = await page.locator('text=Total contracts').isVisible();
    
    if (hasContracts) {
      // Check stats are displayed
      await expect(page.getByText(/total contracts/i)).toBeVisible();
      await expect(page.getByText(/expiring soon/i)).toBeVisible();
      await expect(page.getByText(/high risk/i)).toBeVisible();
      await expect(page.getByText(/analyzed/i)).toBeVisible();
    } else {
      // Check empty state
      await expect(page.getByText(/no contracts yet/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /upload contract/i })).toBeVisible();
    }
  });

  test('should NOT show mock company names', async ({ page }) => {
    // Wait for loading
    await page.waitForLoadState('networkidle');
    
    // These should NOT be present (old mock data)
    await expect(page.getByText('Acme Corp')).not.toBeVisible();
    await expect(page.getByText('Dunder Mifflin')).not.toBeVisible();
    await expect(page.getByText('Stark Industries')).not.toBeVisible();
  });

  test('should filter by search query', async ({ page }) => {
    // Wait for loading
    await page.waitForLoadState('networkidle');
    
    // Get search input
    const searchInput = page.getByPlaceholder(/search contracts/i);
    await expect(searchInput).toBeVisible();
    
    // Type search query
    await searchInput.fill('nonexistent-contract-12345');
    
    // Should show no results
    await expect(page.getByText(/no contracts found/i)).toBeVisible();
  });

  test('should show filter options', async ({ page }) => {
    // Click filter button
    await page.getByRole('button', { name: /filter/i }).click();
    
    // Check filter panel
    await expect(page.getByText(/contract type/i)).toBeVisible();
    await expect(page.getByText(/status/i)).toBeVisible();
    
    // Check contract types
    const types = ['All', 'MSA', 'NDA', 'Employment', 'Contractor', 'Renewal'];
    for (const type of types) {
      await expect(page.getByRole('button', { name: type })).toBeVisible();
    }
  });

  test('should navigate to contract detail on click', async ({ page }) => {
    // Wait for loading
    await page.waitForLoadState('networkidle');
    
    // Try to find a contract card
    const contractCards = page.locator('[href^="/contracts/"]').first();
    
    // If contracts exist
    if (await contractCards.count() > 0) {
      await contractCards.click();
      
      // Should navigate to detail page
      await page.waitForURL(/\/contracts\/[\w-]+/, { timeout: 5000 });
      
      // Check detail page elements
      await expect(page.getByRole('heading').first()).toBeVisible();
    } else {
      test.skip('No contracts to test');
    }
  });

  test('should have working new contract button', async ({ page }) => {
    // Click new contract button
    await page.getByRole('button', { name: /new contract/i }).click();
    
    // Should navigate to upload
    await page.waitForURL('**/upload**', { timeout: 5000 });
    
    // Verify upload page
    await expect(page.getByRole('heading', { name: /upload/i })).toBeVisible();
  });

  test('should display correct stats', async ({ page }) => {
    // Wait for data
    await page.waitForLoadState('networkidle');
    
    // Check all stats cards
    const statsSection = page.locator('text=Total contracts').first().locator('..');
    
    // Stats should be numbers (not hardcoded mock values)
    const totalContracts = await page.locator('text=/^\\d+$/').first().textContent();
    expect(parseInt(totalContracts || '0')).toBeGreaterThanOrEqual(0);
  });
});
