import type { TextItem as PdfjsTextItem } from 'pdfjs-dist/types/src/display/api'
import { readFileSync } from 'fs'
import { join } from 'path'

// Polyfill DOMMatrix for Node.js (required by pdfjs-dist in server environment)
if (typeof globalThis.DOMMatrix === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DOMMatrix } = require('canvas')
  globalThis.DOMMatrix = DOMMatrix
}

// Polyfill Uint8Array.prototype.toHex — added in Node.js 22+, required by pdfjs-dist v5
// Vercel serverless may run Node.js 18/20 which lack this method
if (!Uint8Array.prototype.toHex) {
  Object.defineProperty(Uint8Array.prototype, 'toHex', {
    value: function (): string {
      return Array.from(this as Uint8Array)
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('')
    },
    writable: true,
    configurable: true,
  })
}

let _workerSrc: string | null = null

function getWorkerSrc(): string {
  if (_workerSrc) return _workerSrc
  // Inline the worker as a data: URL so it works in both local Node.js and Vercel Linux
  // Node.js ESM only supports file: and data: URLs — https: is not allowed
  const workerPath = join(process.cwd(), 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs')
  const workerData = readFileSync(workerPath, 'base64')
  _workerSrc = `data:text/javascript;base64,${workerData}`
  return _workerSrc
}

async function getPdfjs() {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = getWorkerSrc()
  return pdfjsLib
}

export type PdfChunk = {
  id: string
  text: string
  page: number
  x: number
  y: number
  width: number
  height: number
}

type TextItem = Pick<PdfjsTextItem, 'str' | 'transform' | 'width' | 'height'>

/**
 * Extract text chunks with coordinates from a PDF URL.
 * Groups nearby text items into sentence/paragraph-level chunks.
 */
export async function extractPdfChunks(pdfUrl: string): Promise<PdfChunk[]> {
  const pdfjsLib = await getPdfjs()

  // Fetch PDF as buffer first — avoids pdfjs making its own HTTP request
  // which fails on private/signed R2 URLs returning 400
  const response = await fetch(pdfUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  const data = new Uint8Array(arrayBuffer)

  const loadingTask = pdfjsLib.getDocument({ data })

  const pdf = await loadingTask.promise
  const chunks: PdfChunk[] = []
  let chunkIndex = 0

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1.0 })
    const textContent = await page.getTextContent()

    // Group text items into logical chunks (by proximity on Y axis)
    // pdfjs-dist returns TextItem | TextMarkedContent — filter to text items only
    const items = textContent.items.filter(
      (item): item is PdfjsTextItem => 'str' in item && typeof (item as PdfjsTextItem).str === 'string' && (item as PdfjsTextItem).str.trim().length > 0
    ) as TextItem[]

    if (items.length === 0) continue

    // Sort items by Y position (top to bottom), then X (left to right)
    const sorted = [...items].sort((a, b) => {
      const yA = viewport.height - a.transform[5]
      const yB = viewport.height - b.transform[5]
      if (Math.abs(yA - yB) > 5) return yA - yB
      return a.transform[4] - b.transform[4]
    })

    // Group nearby items into chunks (gap > 20px = new chunk)
    const groups: TextItem[][] = []
    let currentGroup: TextItem[] = [sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]
      const curr = sorted[i]
      const prevY = viewport.height - prev.transform[5]
      const currY = viewport.height - curr.transform[5]
      const gap = currY - prevY

      // New chunk if Y gap > 20px or X position resets significantly (new paragraph)
      if (gap > 20) {
        groups.push(currentGroup)
        currentGroup = [curr]
      } else {
        currentGroup.push(curr)
      }
    }
    groups.push(currentGroup)

    // Convert groups to PdfChunk objects
    for (const group of groups) {
      const text = group.map(item => item.str).join(' ').trim()
      if (text.length < 10) continue // Skip very short fragments

      const xs = group.map(item => item.transform[4])
      const ys = group.map(item => viewport.height - item.transform[5])
      const minX = Math.min(...xs)
      const minY = Math.min(...ys)
      const maxX = Math.max(...xs.map((x, i) => x + (group[i].width || 0)))
      const maxY = Math.max(...ys.map((y, i) => y + (group[i].height || 12)))

      chunks.push({
        id: `chunk_p${pageNum}_${chunkIndex++}`,
        text,
        page: pageNum,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      })
    }
  }

  return chunks
}
