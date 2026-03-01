import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * PDF Upload and Contract Flow Tests
 * Tests: Upload, OCR, extraction, editing, saving
 */
test.describe('PDF Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to upload page
    await page.goto('/upload');
  });

  test('should display upload page correctly', async ({ page }) => {
    // Check main elements
    await expect(page.getByRole('heading', { name: /upload your contract/i })).toBeVisible();
    await expect(page.getByText(/drag and drop/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /select file/i })).toBeVisible();
    await expect(page.getByText(/pdf, jpg, png, webp up to 20mb/i)).toBeVisible();
  });

  test('should handle file selection', async ({ page }) => {
    // Get file input
    const fileInput = page.locator('input[type="file"]');
    
    // Upload sample PDF
    const filePath = path.join(__dirname, 'fixtures', 'sample-contract.pdf');
    await fileInput.setInputFiles(filePath);
    
    // Should show uploading state
    await expect(page.getByText(/uploading/i)).toBeVisible({ timeout: 5000 });
  });

  test('should extract text and redirect to extracting page', async ({ page }) => {
    // Upload sample PDF
    const fileInput = page.locator('input[type="file"]');
    const filePath = path.join(__dirname, 'fixtures', 'sample-contract.pdf');
    await fileInput.setInputFiles(filePath);
    
    // Wait for redirect to extracting page
    await page.waitForURL('**/extracting**', { timeout: 30000 });
    
    // Check extracting page
    await expect(page.getByText(/extracting contract intelligence/i)).toBeVisible();
    await expect(page.getByText(/reading document structure/i)).toBeVisible();
  });

  test('should complete extraction and redirect to confirm page', async ({ page }) => {
    // Upload sample PDF
    const fileInput = page.locator('input[type="file"]');
    const filePath = path.join(__dirname, 'fixtures', 'sample-contract.pdf');
    await fileInput.setInputFiles(filePath);
    
    // Wait for extraction and redirect to confirm
    await page.waitForURL('**/confirm**', { timeout: 45000 });
    
    // Check confirm page loaded
    await expect(page.getByRole('heading', { name: /review contract details/i })).toBeVisible();
  });

  test('should validate file type rejection', async ({ page }) => {
    // Create an invalid file
    const fileInput = page.locator('input[type="file"]');
    
    // Try to upload invalid file type (if browser allows)
    // Most browsers respect the accept attribute
    await expect(fileInput).toHaveAttribute('accept', /.pdf,.jpg,.jpeg,.png,.webp/);
  });
});

test.describe('Confirm Page - Editable Fields', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to confirm with mock data
    await page.goto('/upload');
    
    // Upload a file first
    const fileInput = page.locator('input[type="file"]');
    const filePath = path.join(__dirname, 'fixtures', 'sample-contract.pdf');
    await fileInput.setInputFiles(filePath);
    
    // Wait for confirm page
    await page.waitForURL('**/confirm**', { timeout: 45000 });
  });

  test('should display all editable fields', async ({ page }) => {
    // Check all form fields are present and editable
    await expect(page.getByLabel(/contract name/i)).toBeVisible();
    await expect(page.getByLabel(/contract type/i)).toBeVisible();
    await expect(page.getByLabel(/party a/i)).toBeVisible();
    await expect(page.getByLabel(/party b/i)).toBeVisible();
    await expect(page.getByLabel(/contract value/i)).toBeVisible();
    await expect(page.getByLabel(/currency/i)).toBeVisible();
    await expect(page.getByLabel(/effective date/i)).toBeVisible();
    await expect(page.getByLabel(/expiry date/i)).toBeVisible();
    await expect(page.getByLabel(/governing law/i)).toBeVisible();
    await expect(page.getByLabel(/ai summary/i)).toBeVisible();
  });

  test('should allow editing contract name', async ({ page }) => {
    const nameInput = page.getByLabel(/contract name/i);
    
    // Clear and type new name
    await nameInput.fill('');
    await nameInput.fill('Updated Contract Name');
    
    // Verify value changed
    await expect(nameInput).toHaveValue('Updated Contract Name');
  });

  test('should allow selecting contract type', async ({ page }) => {
    const typeSelect = page.getByLabel(/contract type/i);
    
    // Select different type
    await typeSelect.selectOption('NDA');
    
    // Verify selection
    await expect(typeSelect).toHaveValue('NDA');
  });

  test('should allow editing amount and currency', async ({ page }) => {
    const amountInput = page.getByLabel(/contract value/i);
    const currencySelect = page.getByLabel(/currency/i);
    
    // Edit amount
    await amountInput.fill('75000');
    await expect(amountInput).toHaveValue('75000');
    
    // Change currency
    await currencySelect.selectOption('EUR');
    await expect(currencySelect).toHaveValue('EUR');
  });

  test('should allow setting dates', async ({ page }) => {
    const effectiveDate = page.getByLabel(/effective date/i);
    const expiryDate = page.getByLabel(/expiry date/i);
    
    // Set dates
    await effectiveDate.fill('2024-06-01');
    await expiryDate.fill('2025-06-01');
    
    // Verify
    await expect(effectiveDate).toHaveValue('2024-06-01');
    await expect(expiryDate).toHaveValue('2025-06-01');
  });

  test('should allow editing AI summary', async ({ page }) => {
    const summaryInput = page.getByLabel(/ai summary/i);
    
    // Edit summary
    const newSummary = 'This is an updated summary of the contract.';
    await summaryInput.fill(newSummary);
    
    // Verify
    await expect(summaryInput).toHaveValue(newSummary);
  });

  test('should validate required fields', async ({ page }) => {
    // Clear required field
    const nameInput = page.getByLabel(/contract name/i);
    await nameInput.fill('');
    
    // Try to save
    await page.getByRole('button', { name: /confirm.*save/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/contract name is required/i)).toBeVisible();
  });

  test('should cancel and return to upload', async ({ page }) => {
    // Click cancel
    await page.getByRole('button', { name: /cancel/i }).click();
    
    // Should redirect to upload
    await page.waitForURL('**/upload**', { timeout: 5000 });
  });

  test('should save contract successfully', async ({ page }) => {
    // Fill in required data
    await page.getByLabel(/contract name/i).fill('Test Contract');
    await page.getByLabel(/contract type/i).selectOption('Service');
    await page.getByLabel(/party a/i).fill('Test Company A');
    await page.getByLabel(/party b/i).fill('Test Company B');
    await page.getByLabel(/contract value/i).fill('50000');
    await page.getByLabel(/effective date/i).fill('2024-01-01');
    
    // Save
    await page.getByRole('button', { name: /confirm.*save/i }).click();
    
    // Should redirect to contracts list
    await page.waitForURL('**/contracts**', { timeout: 10000 });
    
    // Verify saved contract appears
    await expect(page.getByText('Test Contract')).toBeVisible();
  });
});
