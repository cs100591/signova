import { readFileSync } from 'fs'
import { join } from 'path'

// DOMMatrix polyfill for Node.js (required by pdfjs-dist)
// Node.js 22 does not include DOMMatrix, and @napi-rs/canvas (pdfjs's fallback)
// is not available on Vercel. This pure-JS polyfill covers what pdfjs needs.
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0
    m11 = 1; m12 = 0; m13 = 0; m14 = 0
    m21 = 0; m22 = 1; m23 = 0; m24 = 0
    m31 = 0; m32 = 0; m33 = 1; m34 = 0
    m41 = 0; m42 = 0; m43 = 0; m44 = 1
    is2D = true
    isIdentity = true
    
    constructor(init?: string | number[]) {
      if (typeof init === 'string') {
        // Parse matrix string
        const m = init.match(/matrix\(([^)]+)\)/)
        if (m) {
          const vals = m[1].split(/,\s*/).map(Number)
          this._setFromArray(vals.length >= 6 ? vals : [1, 0, 0, 1, 0, 0])
        }
      } else if (Array.isArray(init)) {
        if (init.length === 6) {
          this._setFromArray(init)
        } else if (init.length === 16) {
          this.a = init[0]; this.b = init[1]; this.c = init[4]; this.d = init[5]
          this.e = init[12]; this.f = init[13]
          this.m11 = init[0]; this.m12 = init[1]; this.m13 = init[2]; this.m14 = init[3]
          this.m21 = init[4]; this.m22 = init[5]; this.m23 = init[6]; this.m24 = init[7]
          this.m31 = init[8]; this.m32 = init[9]; this.m33 = init[10]; this.m34 = init[11]
          this.m41 = init[12]; this.m42 = init[13]; this.m43 = init[14]; this.m44 = init[15]
          this._update2D()
        }
      }
    }
    
    _setFromArray(vals: number[]) {
      [this.a, this.b, this.c, this.d, this.e, this.f] = vals
      this.m11 = this.a; this.m12 = this.b; this.m21 = this.c; this.m22 = this.d
      this.m41 = this.e; this.m42 = this.f
      this._update2D()
    }
    
    _update2D() {
      this.is2D = this.m13 === 0 && this.m14 === 0 && this.m23 === 0 && this.m24 === 0 &&
                  this.m31 === 0 && this.m32 === 0 && this.m33 === 1 && this.m34 === 0 &&
                  this.m43 === 0 && this.m44 === 1
      this.isIdentity = this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 &&
                        this.e === 0 && this.f === 0
    }
    
    multiply(other: DOMMatrix) {
      return new DOMMatrix([
        this.a * other.a + this.c * other.b,
        this.b * other.a + this.d * other.b,
        this.a * other.c + this.c * other.d,
        this.b * other.c + this.d * other.d,
        this.a * other.e + this.c * other.f + this.e,
        this.b * other.e + this.d * other.f + this.f
      ])
    }
    
    preMultiplySelf(other: DOMMatrix) {
      const result = other.multiply(this)
      Object.assign(this, result)
      return this
    }
    
    multiplySelf(other: DOMMatrix) {
      const result = this.multiply(other)
      Object.assign(this, result)
      return this
    }
    
    invertSelf() {
      const det = this.a * this.d - this.b * this.c
      if (det === 0) return this
      const vals = [
        this.d / det,
        -this.b / det,
        -this.c / det,
        this.a / det,
        (this.c * this.f - this.d * this.e) / det,
        (this.b * this.e - this.a * this.f) / det
      ]
      this._setFromArray(vals)
      return this
    }
    
    inverse() {
      return new DOMMatrix([this.a, this.b, this.c, this.d, this.e, this.f]).invertSelf()
    }
    
    translate(tx = 0, ty = 0, tz = 0) {
      return new DOMMatrix([
        this.a, this.b, this.c, this.d,
        this.a * tx + this.c * ty + this.e,
        this.b * tx + this.d * ty + this.f
      ])
    }
    
    scale(scaleX = 1, scaleY = scaleX) {
      return new DOMMatrix([
        this.a * scaleX, this.b * scaleX,
        this.c * scaleY, this.d * scaleY,
        this.e, this.f
      ])
    }
    
    transformPoint(point: { x: number; y: number }) {
      return {
        x: this.a * point.x + this.c * point.y + this.e,
        y: this.b * point.x + this.d * point.y + this.f
      }
    }
    
    toString() {
      return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`
    }
  } as any
}

import { createRequire } from 'module'
import type { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs'

export type PdfChunk = {
  id: string
  text: string
  page: number
  x: number
  y: number
  width: number
  height: number
  pageWidth: number
  pageHeight: number
}

interface TextItem {
  str: string
  dir: string
  width: number
  height: number
  transform: number[] // [a, b, c, d, e, f] where e=x, f=y (baseline from bottom)
  fontName: string
  hasEOL: boolean
}

// Cache for worker data URL
let _workerDataUrl: string | null = null

// Get worker as data: URL — Node.js ESM only supports file: and data: URLs
function getWorkerDataUrl(): string {
  if (_workerDataUrl) return _workerDataUrl
  const workerPath = join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')
  const workerData = readFileSync(workerPath, 'base64')
  _workerDataUrl = `data:text/javascript;base64,${workerData}`
  return _workerDataUrl
}

// Dynamically import pdfjs-dist to avoid module loading issues at build time
async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  // Use data: URL for worker — Node.js ESM only supports file: and data: protocols
  pdfjs.GlobalWorkerOptions.workerSrc = getWorkerDataUrl()
  return pdfjs
}

/**
 * Extract text chunks with REAL coordinates from a PDF using pdfjs-dist.
 * 
 * Uses the legacy build which is compatible with Node.js server environments.
 * Coordinates are extracted from the actual PDF text positions and flipped
 * from PDF coordinate system (y from bottom) to viewport coordinates (y from top).
 * 
 * Each line of text becomes one chunk, which matches the granularity that
 * AI uses when identifying contract clauses.
 */
export async function extractPdfChunks(pdfUrl: string): Promise<PdfChunk[]> {
  const chunks: PdfChunk[] = []
  
  try {
    // Load pdfjs-dist dynamically (workerSrc is set inside loadPdfJs)
    const pdfjs = await loadPdfJs()
    const { getDocument } = pdfjs
    
    // Fetch PDF
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
    }
    
    const buffer = Buffer.from(await response.arrayBuffer())
    
    // Load PDF with pdfjs - must use Uint8Array, not Buffer
    const pdf = await getDocument({ 
      data: new Uint8Array(buffer),
      verbosity: 0,
    }).promise
    
    let chunkIndex = 0
    
    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const viewport = page.getViewport({ scale: 1.0 })
      const pageWidth = viewport.width
      const pageHeight = viewport.height
      
      // Group text items by line using their y-coordinate (PDF: y from bottom)
      const lineMap = new Map<number, TextItem[]>()
      
      for (const item of textContent.items) {
        if ('str' in item && item.str.trim().length > 0) {
          const textItem = item as TextItem
          const yKey = Math.round(textItem.transform[5])
          
          if (!lineMap.has(yKey)) {
            lineMap.set(yKey, [])
          }
          lineMap.get(yKey)!.push(textItem)
        }
      }
      
      // Sort lines top to bottom (PDF: larger y = higher on page)
      const sortedLines = Array.from(lineMap.entries()).sort((a, b) => b[0] - a[0])
      
      // Create one chunk per line
      for (const [yPdf, items] of sortedLines) {
        // Sort items in line left to right
        items.sort((a, b) => a.transform[4] - b.transform[4])
        
        const text = items.map(item => item.str).join(' ').trim()
        if (text.length <= 5) continue
        
        const firstItem = items[0]
        const lastItem = items[items.length - 1]
        const lineHeight = Math.max(...items.map(item => item.height || 12))
        
        const x = firstItem.transform[4]
        const width = (lastItem.transform[4] + lastItem.width) - x
        
        // Coordinate conversion:
        // PDF: y increases from bottom, transform[5] is baseline position
        // Viewport: y increases from top, we want top of text box
        // So: y_top = pageHeight - (baseline + height)
        const yTop = pageHeight - (yPdf + lineHeight)
        
        chunks.push({
          id: `chunk_p${pageNum}_${chunkIndex++}`,
          text,
          page: pageNum,
          x,
          y: yTop,
          width,
          height: lineHeight,
          pageWidth,
          pageHeight,
        })
      }
      
      page.cleanup()
    }
    
    pdf.destroy()
    
  } catch (error) {
    console.error('[extractPdfChunks] Error:', error)
    throw error
  }
  
  return chunks
}
