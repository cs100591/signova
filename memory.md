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

## Pending Issues
- Stripe Checkout is still failing in production with 'An error occurred with our connection to Stripe'. Need to check the detailed error modal output or Vercel edge function logs post-deployment to isolate if it is an invalid Price ID issue, an empty email customer creation issue, or a success_url formatting issue.
