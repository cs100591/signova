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
| AI Comparisons | **1** (lifetime) | **3/mo** | **15/mo** | **50/mo** |
| Expiry Reminders | No | Yes | Yes | Yes |
| Workspaces | 1 | 1 | 5 | Unlimited |
| Seats | 1 | 1 | 3 | 10 |

### Files Updated (4 phases)
**Phase 1 — Core Quota:**
- `lib/plans.ts` — Single source of truth for plan definitions (analyses + comparisons)
- `lib/usage.ts` — Added `canCompareContract()`, `incrementComparisonUsage()`, free = lifetime quota
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
- **Free comparisons = lifetime** (not monthly): 1 comparison ever, no reset
- **Paid comparisons = monthly**: reset on billing cycle like analyses
- **History reload = free**: re-extracts chunks from PDFs but reuses stored AI analysis (no API cost)
- **`usage-stats.tsx` has its own PLAN_DETAILS**: Does NOT import from `lib/plans.ts` — both must be updated when quotas change

### DB Migration Required
POST `/api/admin/migrate?secret=signova-migrate-2026` to add:
- `comparisons_used INTEGER DEFAULT 0`
- `comparisons_reset_date DATE`

## Pending Issues
- Stripe Checkout is still failing in production with 'An error occurred with our connection to Stripe'. Need to check the detailed error modal output or Vercel edge function logs post-deployment to isolate if it is an invalid Price ID issue, an empty email customer creation issue, or a success_url formatting issue.
