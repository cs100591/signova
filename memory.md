# Memory

## Tasks Completed Today
- Added email verification modal to the signup flow `app/login/page.tsx`.
- Configured signup to bypass modal when `data.session` is directly returned.
- Replaced dummy Stripe environment variables with actual production live keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`) inside Vercel's production environment.
- Added `NEXT_PUBLIC_APP_URL` (set to https://www.signova.me) to Vercel production to fix checkout success/cancel URL redirect parameters.
- Downgraded Stripe API version explicitly requested in `lib/stripe.ts` from `2026-02-25.clover` to `2025-02-24.acacia` to resolve typescript/build conflict with `stripe@20.4.0` package.
- Expanded error catching inside `app/api/stripe/checkout/route.ts` to output detailed stringified error messages directly to the frontend modal (to trace what is still causing connection/creation errors post-auth).

## Lessons Learned: PDF Text Extraction for Compare Feature

### The Problem
Contract Compare feature requires extracting text with coordinates from PDFs for accurate highlighting. We tried multiple approaches before finding the working solution.

### Failed Approaches

**1. pdf-parse-fork**
- ❌ Only extracts text, no coordinates
- ❌ Highlight positioning completely wrong (estimated coordinates)
- ❌ Cannot handle scanned/image-based PDFs

**2. pdf2json**
- ❌ Returns normalized coordinates (0.0-1.0) not actual PDF points
- ❌ Y-coordinate system mismatch (pdf2json: top=0, PDF.js: bottom=0)
- ❌ Requires complex coordinate conversion that never worked correctly
- ❌ Highlight positions were completely wrong

**3. pdfjs-dist (initial attempt)**
- ❌ DOMMatrix API not available in Node.js 22
- ❌ Worker file loading issues on Vercel (file:// protocol not allowed)
- ❌ Build errors on Vercel serverless functions

### Working Solution: pdfjs-dist with Vercel Compatibility Patches

**Location:** `lib/pdf/extractWithPositions.ts`

**Key Components:**

1. **DOMMatrix Polyfill** (lines 7-123)
   ```typescript
   // Node.js 22 doesn't have DOMMatrix, pdfjs-dist needs it
   if (typeof globalThis.DOMMatrix === 'undefined') {
     globalThis.DOMMatrix = class DOMMatrix { ... }
   }
   ```

2. **Data URL Worker** (lines 170-181)
   ```typescript
   // Vercel doesn't allow file:// URLs, use data: URLs instead
   function getWorkerDataUrl(): string {
     const workerPath = join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')
     const workerData = readFileSync(workerPath, 'base64')
     return `data:text/javascript;base64,${workerData}`
   }
   ```

3. **Legacy Build Import** (line 15)
   ```typescript
   import type { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs'
   ```

4. **Coordinate Conversion** (lines 220-232)
   ```typescript
   // PDF.js returns actual PDF points with y from bottom
   // Convert to viewport coordinates with y from top
   const x = firstItem.transform[4]
   const yTop = pageHeight - (yPdf + lineHeight)
   ```

### Why This Works

- **Real PDF Coordinates:** pdfjs-dist extracts actual PDF coordinates (in points)
- **Vercel Compatible:** Uses data: URL workers (no file system access needed)
- **Node.js Compatible:** DOMMatrix polyfill fills the missing API
- **Accurate Highlighting:** Coordinates match exactly with react-pdf-highlighter

### Fallback for Scanned PDFs

When pdfjs-dist returns no text (scanned/image PDFs), the system falls back to the `extracted_text` field stored in the database during upload (which uses Claude Haiku OCR).

**File:** `lib/pdf/extractWithPositions.ts` - function `extractChunksWithFallback()`

### Key Takeaway

When working with PDFs on Vercel:
- ✅ Use pdfjs-dist legacy build
- ✅ Provide DOMMatrix polyfill
- ✅ Use data: URL for worker (not file://)
- ❌ Avoid pdf-parse (no coordinates)
- ❌ Avoid pdf2json (coordinate system incompatible)
- ❌ Don't assume standard Node.js APIs exist in serverless

## Subscription Redesign (Completed)

### Updated Plan Quotas
| | Free | Solo $9.9 | Pro $29 | Business $69 |
|---|---|---|---|---|
| Contracts | 3 | 50 | Unlimited | Unlimited |
| AI Analyses | 3 | **25/mo** | **80/mo** | **300/mo** |
| AI Comparisons | **1/mo** | **3/mo** | **15/mo** | **50/mo** |
| Expiry Reminders | No | Yes | Yes | Yes |
| Workspaces | 1 | 1 | 5 | Unlimited |
| Seats | 1 | 1 | 3 | 10 |

### Files Updated (4 phases)
**Phase 1 — Core Quota:**
- `lib/plans.ts` — Single source of truth for plan definitions (analyses + comparisons)
- `lib/usage.ts` — Added `canCompareContract()`, `incrementComparisonUsage()`
- `app/api/contracts/compare/route.ts` — GET (history + reload), POST (quota check + increment)
- `app/api/admin/migrate/route.ts` — Added `comparisons_used`, `comparisons_reset_date` columns

**Phase 2 — History UI:**
- `components/compare/CompareHistory.tsx` — New component: comparison history list
- `app/(dashboard)/compare/page.tsx` — Rewritten: history, quota badge, reload without AI cost

**Phase 3 — UI Updates:**
- `components/usage-stats.tsx` — Updated PLAN_DETAILS (25/80/300), added comparisons usage bar + quick stat
- `components/settings/subscription-manager.tsx` — Added comparisons usage bar, comparisons in upgrade cards
- `app/(landing)/components/Pricing.tsx` — Updated analyses, added comparisons, added Business plan (4-col)
- `signova-landing.html` — Updated all 4 pricing cards with correct numbers + comparisons row

**Phase 4 — Content Updates:**
- `lib/emails/onboarding.js` — Updated quota numbers (30→25), added AI Compare as paid feature highlight

### Key Design Decisions
- **ALL plans reset comparisons monthly** (including Free) — changed from lifetime to monthly
- **History reload = free**: re-extracts chunks from PDFs but reuses stored AI analysis (no API cost)
- **`usage-stats.tsx` has its own PLAN_DETAILS**: Does NOT import from `lib/plans.ts` — both must be updated when quotas change

### DB Migration (Completed)
Columns added to `profiles` table (confirmed exist):
- `comparisons_used INTEGER DEFAULT 0`
- `comparisons_reset_date DATE`

## Bug Fixes (2026-03-09)

### 1. Duplicate Detection Modal — Button Overflow
**File:** `app/(dashboard)/upload/page.tsx:215-221`
**Problem:** Two `w-full` buttons in `flex gap-4` overflowed the card container.
**Fix:** Changed to `flex-1 min-w-0` so buttons share space equally.

### 2. Confirm Page — Bottom Buttons Overlap
**File:** `app/(dashboard)/confirm/page.tsx:489-517`
**Problem:** `sticky bottom-0` then `fixed bottom-0` both caused overlap with the 260px sidebar and mobile bottom nav.
**Fix:** Removed fixed/sticky entirely. Buttons are now in normal document flow (`mt-8 pb-8`) — they scroll with the form content, no positioning conflicts.

### 3. Contract Value Parsing — Multiple Values Concatenated
**Problem:** AI returns `"MYR 5,500 monthly rent; MYR 11,000 deposit"` → old regex `replace(/[^\d.]/g, "")` strips everything → concatenates into `550011000`.
**Three-part fix:**

**3a. Parsing** (`confirm/page.tsx:137-143`):
- Changed from `replace(/[^\d.]/g, "")` to `match(/[\d,]+\.?\d*/)` — extracts only the FIRST number.

**3b. Currency Display** (`contracts/page.tsx` + `contracts/[id]/page.tsx`):
- Removed hardcoded `$` prefix.
- Added `CURRENCY_SYMBOLS` map (RM, S$, £, etc.) and `formatCurrency(amount, currency)` with proper comma grouping.
- `amount` can be number OR string from DB — always coerce with `String()` before `.replace()`.
- **IMPORTANT:** `formatCurrency` signature is `(amount: string | number | null, currency: string | null)` — must handle numbers from Supabase.

**3c. AI Prompt** (`lib/ai.ts:217`):
- Updated extraction prompt to instruct Haiku: return amount as a plain number (no symbols/commas/text), return only the primary recurring value for monthly contracts, and return a separate `currency` field (3-letter code).

### 4. /contracts Page Crash — TypeError: e.replace is not a function
**Problem:** `contract.amount` comes from Supabase as a number (not string), so `.replace()` on it throws.
**Fix:** Added `String()` coercion in `formatCurrency()` before calling `.replace()`.

### 5. Comparisons — All Plans Monthly Reset
**Problem:** Free plan had lifetime (never reset) comparison quota, user wanted all plans to reset monthly.
**Fix:**
- `lib/usage.ts`: Removed `if (plan !== 'free')` guard in `canCompareContract()` and `incrementComparisonUsage()`. Monthly reset now applies to all plans.
- `components/usage-stats.tsx`: Removed "(lifetime)" label and free-specific warning text.
- `components/settings/subscription-manager.tsx`: Removed "(lifetime)" label.

### DB Data Fixes Applied
Manually corrected existing contracts with wrong values from old parsing:
- SOFTWARE LICENSE (`066fd7f8`): `360,003,000` → `36,000` MYR
- 2x Shah Alam Tenancy (`42cdc129`, `50ac72ed`): `$4,200.01 USD` → `RM4,200 MYR`
- 9 contracts: currency `USD` → `MYR` (all had MYR in their summaries, defaulted to USD before the AI prompt fix)

## Pending Issues
- Stripe Checkout is still failing in production with 'An error occurred with our connection to Stripe'. Need to check the detailed error modal output or Vercel edge function logs post-deployment to isolate if it is an invalid Price ID issue, an empty email customer creation issue, or a success_url formatting issue.

## Next Steps (from AGENTS.md)
- Phase 1.5: OCR support for scanned contracts (Google Vision)
- Phase 2: Dashboard (4-stat cards on home), Quick Ask chips, Finding card copy/collapse, Filters, PDF export
- Expiry reminder email system (Cron job) — Phase 1 item 6, still pending
