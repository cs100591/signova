# Signova E2E Tests

Comprehensive Playwright tests for Signova app covering all the recent fixes.

## Test Coverage

### 1. Login Flow (`login.spec.ts`)
- ✅ Login form display
- ✅ Toggle between login/signup
- ✅ Form validation
- ✅ Session persistence
- ✅ Redirect behavior

### 2. PDF Upload (`upload.spec.ts`)
- ✅ Upload page display
- ✅ File selection handling
- ✅ Text extraction flow
- ✅ Navigation to extracting page
- ✅ File type validation

### 3. Confirm Page (`upload.spec.ts`)
- ✅ All editable fields present:
  - Contract name (required)
  - Contract type (dropdown)
  - Party A & B names
  - Amount & currency
  - Effective & expiry dates
  - Governing law
  - AI summary (textarea)
- ✅ Field editing
- ✅ Form validation
- ✅ Cancel navigation
- ✅ Save contract flow

### 4. Contracts List (`contracts.spec.ts`)
- ✅ Real data fetching (no mock data)
- ✅ No Acme Corp / Dunder Mifflin / Stark Industries
- ✅ Empty state display
- ✅ Search filtering
- ✅ Type/Status filters
- ✅ Stats calculation
- ✅ Navigation to detail

### 5. Terminal Chat (`terminal.spec.ts`)
- ✅ New AI Legal Assistant interface
- ✅ Contract text input textarea
- ✅ Quick questions display
- ✅ Contract analysis flow
- ✅ General legal Q&A without contract
- ✅ Chat message handling
- ✅ Chat history sidebar
- ✅ New chat functionality
- ✅ No old contract selector dropdown

## Running Tests

### Install dependencies:
```bash
npm install
npx playwright install chromium
```

### Run all tests:
```bash
npx playwright test
```

### Run specific test file:
```bash
npx playwright test login.spec.ts
npx playwright test upload.spec.ts
npx playwright test contracts.spec.ts
npx playwright test terminal.spec.ts
```

### Run with UI mode:
```bash
npx playwright test --ui
```

### Run against production:
```bash
TEST_BASE_URL=https://signova-blond.vercel.app npx playwright test
```

### Run with authenticated user:
```bash
TEST_USER_EMAIL=user@example.com TEST_USER_PASSWORD=password npx playwright test
```

## Test Fixtures

- `fixtures/sample-contract.pdf` - Test PDF file for upload tests

## Configuration

Tests are configured in `playwright.config.ts`:
- Base URL: `http://localhost:3000` (dev) or env var
- Browser: Chromium
- Screenshots: On failure
- Video: On failure
- Traces: On first retry

## Expected Results

All tests should pass with the recent fixes:
- PDF uploads work without "pattern" error
- Confirm page allows editing all fields
- Contracts list shows real data
- No mock company names appear
- Terminal works as legal Q&A chatbot
- Login session persists correctly
