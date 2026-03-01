import { test, expect } from '@playwright/test';

/**
 * Terminal Chat Tests
 * Tests: New chatbot interface, contract analysis, quick questions
 */
test.describe('Terminal - AI Legal Assistant', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/terminal');
  });

  test('should display terminal page correctly', async ({ page }) => {
    // Check header
    await expect(page.getByRole('heading', { name: /ai legal assistant/i })).toBeVisible();
    
    // Check contract input section
    await expect(page.getByText(/paste contract text/i)).toBeVisible();
    
    // Check textarea
    await expect(page.getByPlaceholder(/paste your contract text here/i)).toBeVisible();
    
    // Check buttons
    await expect(page.getByRole('button', { name: /analyze contract/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /skip.*general questions/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /new chat/i })).toBeVisible();
  });

  test('should display quick questions', async ({ page }) => {
    // Check quick questions section
    await expect(page.getByText(/popular legal questions/i)).toBeVisible();
    
    // Check some common questions
    const questions = [
      'What should I look for in an NDA?',
      'Is this termination clause fair?',
      'Explain liability clauses',
    ];
    
    for (const question of questions) {
      await expect(page.getByText(question)).toBeVisible();
    }
  });

  test('should allow pasting contract text', async ({ page }) => {
    const textarea = page.getByPlaceholder(/paste your contract text here/i);
    
    // Type contract text
    const contractText = `
      SERVICE AGREEMENT
      
      This agreement is between Company A and Company B.
      Term: 12 months
      Value: $50,000
      
      Either party may terminate with 30 days notice.
    `;
    
    await textarea.fill(contractText);
    
    // Verify text entered
    await expect(textarea).toHaveValue(contractText);
  });

  test('should analyze contract when text provided', async ({ page }) => {
    const textarea = page.getByPlaceholder(/paste your contract text here/i);
    
    // Enter contract text
    await textarea.fill(`
      SERVICE AGREEMENT
      Between: ABC Corp and XYZ Inc.
      Term: One year
      Value: $100,000
      Termination: 90 days notice required
    `);
    
    // Click analyze
    const analyzeButton = page.getByRole('button', { name: /analyze contract/i });
    await analyzeButton.click();
    
    // Should show loading state
    await expect(page.getByText(/analyzing/i)).toBeVisible();
    
    // Wait for response (may take time)
    await page.waitForTimeout(5000);
    
    // Should show chat interface with response
    await expect(page.locator('[class*="rounded-2xl"]').first()).toBeVisible();
  });

  test('should skip to general questions without contract', async ({ page }) => {
    // Click skip link
    await page.getByText(/skip.*general questions/i).click();
    
    // Should show chat interface
    await expect(page.getByPlaceholder(/ask a legal question/i)).toBeVisible();
  });

  test('should handle quick question click', async ({ page }) => {
    // Click a quick question
    await page.getByText('What should I look for in an NDA?').click();
    
    // Should show chat interface
    await expect(page.getByPlaceholder(/ask.*contract/i).or(page.getByPlaceholder(/ask a legal question/i))).toBeVisible();
    
    // Wait for response
    await page.waitForTimeout(8000);
    
    // Should show assistant response
    const messages = page.locator('[class*="rounded-2xl"]').filter({ hasText: /./ });
    await expect(messages.first()).toBeVisible();
  });

  test('should start new chat', async ({ page }) => {
    // Click new chat
    await page.getByRole('button', { name: /new chat/i }).click();
    
    // Should reset to initial state
    await expect(page.getByPlaceholder(/paste your contract text here/i)).toBeVisible();
  });

  test('should show chat history sidebar', async ({ page }) => {
    // Click history button
    await page.getByRole('button', { name: /history/i }).click();
    
    // Should show history sidebar
    await expect(page.getByText(/chat history/i)).toBeVisible();
    
    // Close history
    await page.getByText(/close history/i).click();
    
    // Should hide sidebar
    await expect(page.getByText(/close history/i)).not.toBeVisible();
  });

  test('should handle chat message input', async ({ page }) => {
    // First skip to chat
    await page.getByText(/skip.*general questions/i).click();
    
    // Get input
    const input = page.getByPlaceholder(/ask.*contract/i).or(page.getByPlaceholder(/ask a legal question/i));
    
    // Type message
    await input.fill('What is a standard payment term?');
    
    // Send message (Enter key)
    await input.press('Enter');
    
    // Should show user message
    await expect(page.getByText('What is a standard payment term?')).toBeVisible();
    
    // Wait for AI response
    await page.waitForTimeout(8000);
    
    // Should show response
    const assistantMessages = page.locator('[class*="bg-white"]').filter({ hasText: /./ });
    await expect(assistantMessages.first()).toBeVisible();
  });

  test('should show contract loaded indicator', async ({ page }) => {
    const textarea = page.getByPlaceholder(/paste your contract text here/i);
    
    // Enter contract
    await textarea.fill('Sample contract text for testing.');
    
    // Click analyze
    await page.getByRole('button', { name: /analyze contract/i }).click();
    
    // Wait for chat
    await page.waitForTimeout(5000);
    
    // Should show "Contract text loaded" indicator
    await expect(page.getByText(/contract text loaded/i)).toBeVisible();
  });

  test('should NOT have contract selector dropdown', async ({ page }) => {
    // Old version had a contract selector dropdown - should not exist now
    await expect(page.locator('select').filter({ hasText: /acme|dunder|stark/i })).not.toBeVisible();
  });
});
