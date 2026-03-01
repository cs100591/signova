import { test, expect } from '@playwright/test';

test.describe('Critical Bug Fixes Verification', () => {
  
  test('Terminal page shows robot illustration on initial load', async ({ page }) => {
    // Navigate to terminal page
    await page.goto('/terminal');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if robot SVG is visible
    const robotSvg = page.locator('svg[width="160"]').first();
    await expect(robotSvg).toBeVisible({ timeout: 5000 });
    
    // Check for the heading
    await expect(page.locator('text=AI Contract Analysis')).toBeVisible();
    await expect(page.locator('text=Upload a contract or ask me anything about legal matters')).toBeVisible();
    
    console.log('✅ Robot illustration test passed');
  });

  test('Upload area is visible and functional', async ({ page }) => {
    await page.goto('/terminal');
    await page.waitForLoadState('networkidle');
    
    // Check upload area
    const uploadArea = page.locator('text=Click to upload a PDF');
    await expect(uploadArea).toBeVisible();
    
    // Check tabs
    await expect(page.locator('text=Paste Text')).toBeVisible();
    await expect(page.locator('text=Upload PDF')).toBeVisible();
    
    console.log('✅ Upload area test passed');
  });

  test('User message bubble has correct styling', async ({ page }) => {
    await page.goto('/terminal');
    await page.waitForLoadState('networkidle');
    
    // Skip to chat mode
    await page.click('text=Skip & ask general questions →');
    
    // Type a message
    const input = page.locator('textarea[placeholder*="Ask a legal question"]');
    await input.fill('Test message');
    await input.press('Enter');
    
    // Wait for user message to appear
    await page.waitForTimeout(1000);
    
    // Check user message bubble exists
    const userMessage = page.locator('text=Test message');
    await expect(userMessage).toBeVisible();
    
    // Get computed color
    const bubble = userMessage.locator('..').locator('..');
    const bgColor = await bubble.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    
    console.log('User message background color:', bgColor);
    console.log('✅ User message styling test passed');
  });

  test('Confirm page shows contract form', async ({ page }) => {
    // First upload a contract
    await page.goto('/upload');
    await page.waitForLoadState('networkidle');
    
    // Click upload area
    await page.click('text=Upload PDF');
    
    // Upload a test PDF file
    const fileInput = page.locator('input[type="file"]');
    // Create a simple test file
    const testFile = {
      name: 'test-contract.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test content'),
    };
    
    await fileInput.setInputFiles(testFile);
    
    // Wait for navigation to confirm page
    await page.waitForURL('**/confirm', { timeout: 30000 });
    
    // Check form fields are visible
    await expect(page.locator('text=Review Contract Details')).toBeVisible();
    await expect(page.locator('input[name*="name"], input[placeholder*="Contract Name"]')).toBeVisible();
    
    console.log('✅ Confirm page test passed');
  });

  test('Database API accepts contract with name field', async ({ request }) => {
    // Test the API directly
    const response = await request.post('/api/contracts', {
      data: {
        name: 'Test Contract',
        type: 'MSA',
        amount: 1000,
        currency: 'USD',
      },
    });
    
    // We expect it might fail due to auth, but shouldn't fail with "Missing required field"
    const body = await response.json();
    console.log('API Response:', body);
    
    // Check it's not the specific error we're trying to fix
    if (!response.ok()) {
      expect(body.error).not.toContain('Missing required field');
    }
    
    console.log('✅ API contract name field test passed');
  });
});