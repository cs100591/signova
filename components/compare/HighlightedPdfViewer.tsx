"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
import { PdfHighlighter, PdfLoader, Highlight } from "react-pdf-highlighter";
import "react-pdf-highlighter/dist/style.css";
import type { IHighlight } from "react-pdf-highlighter";
import type { T_ViewportHighlight } from "react-pdf-highlighter/dist/components/PdfHighlighter";
import { AlertTriangle } from "lucide-react";

export type ComparedChunk = {
  id: string;
  text: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  pageWidth?: number;
  pageHeight?: number;
  riskLevel?: "high" | "medium" | "low" | "none";
  riskChange?: "increased" | "decreased" | "same" | "new" | "removed";
  changeType?: "modified" | "added" | "removed" | "unchanged";
  topic?: string;
  summary?: string;
  matchIndex?: number;
};

export type HighlightedPdfViewerHandle = {
  scrollToChunk: (chunkId: string) => void;
  getScrollContainer: () => HTMLElement | null;
};

type Props = {
  pdfUrl: string;
  chunks: ComparedChunk[];
  onPageChange?: (page: number) => void;
  scrollToPage?: number;
  label?: string;
};

function getHighlightColor(chunk: ComparedChunk): string {
  if (chunk.riskLevel === "high") return "#FF4444";
  if (chunk.riskChange === "increased") return "#FF8C00";
  if (chunk.riskChange === "decreased") return "#22C55E";
  if (chunk.changeType === "modified") return "#3B82F6";
  if (chunk.changeType === "added" || chunk.changeType === "removed") return "#6B7280";
  return "transparent";
}

function chunksToHighlights(chunks: ComparedChunk[]): IHighlight[] {
  console.log("[chunksToHighlights] Input chunks:", {
    total: chunks.length,
    withRiskLevel: chunks.filter(c => c.riskLevel).length,
    withRiskChange: chunks.filter(c => c.riskChange).length,
    withChangeType: chunks.filter(c => c.changeType).length,
    sampleChunks: chunks.slice(0, 3).map(c => ({
      id: c.id,
      riskLevel: c.riskLevel,
      riskChange: c.riskChange,
      changeType: c.changeType,
      coords: { x: c.x, y: c.y, w: c.width, h: c.height, page: c.page }
    }))
  });

  const filtered = chunks.filter((c) => getHighlightColor(c) !== "transparent");
  console.log("[chunksToHighlights] After color filter:", {
    passed: filtered.length,
    rejected: chunks.length - filtered.length,
    colors: filtered.map(c => ({ id: c.id, color: getHighlightColor(c) }))
  });

  const highlights = filtered.map((chunk) => {
    // Use actual PDF page dimensions if available, fallback to US Letter (612x792)
    const pageW = chunk.pageWidth ?? 612;
    const pageH = chunk.pageHeight ?? 792;
    
    return {
      id: chunk.id,
      content: { text: chunk.text },
      comment: { text: chunk.summary || chunk.topic || "", emoji: "" },
      position: {
        boundingRect: {
          // PDF coordinates in points - scaledToViewport will convert to viewport pixels
          x1: chunk.x,
          y1: chunk.y,
          x2: chunk.x + chunk.width,
          y2: chunk.y + chunk.height,
          width: pageW,
          height: pageH,
          pageNumber: chunk.page,
        },
        rects: [
          {
            x1: chunk.x,
            y1: chunk.y,
            x2: chunk.x + chunk.width,
            y2: chunk.y + chunk.height,
            width: pageW,
            height: pageH,
            pageNumber: chunk.page,
          },
        ],
        pageNumber: chunk.page,
      },
    };
  });

  console.log("[chunksToHighlights] Output highlights:", highlights.length);
  return highlights;
}

const HighlightedPdfViewer = forwardRef<HighlightedPdfViewerHandle, Props>(
  ({ pdfUrl, chunks, label }, ref) => {
    const scrollRef = useRef<(highlight: IHighlight) => void>(() => {});
    const containerRef = useRef<HTMLDivElement>(null);
    const highlights = chunksToHighlights(chunks);

    console.log("[HighlightedPdfViewer] Render:", {
      label,
      inputChunks: chunks.length,
      outputHighlights: highlights.length,
      highlightIds: highlights.map(h => h.id)
    });

    useImperativeHandle(ref, () => ({
      scrollToChunk(chunkId: string) {
        const h = highlights.find((h) => h.id === chunkId);
        if (h) scrollRef.current(h);
      },
      getScrollContainer() {
        // PdfHighlighter renders a scrollable div inside our container
        return containerRef.current?.querySelector(".PdfHighlighter") as HTMLElement | null;
      },
    }));

    return (
      <div className="flex flex-col h-full min-h-0">
        {label && (
          <div className="px-3 py-2 border-b border-[#e0d9ce] bg-[#f5f0e8] text-sm font-medium text-[#1a1714] flex-shrink-0">
            {label}
          </div>
        )}
        <div className="flex-1 relative overflow-hidden" ref={containerRef}>
          <div style={{ position: "absolute", inset: 0 }}>
            <PdfLoader url={pdfUrl} beforeLoad={<PdfLoadingSpinner />} errorMessage={<PdfErrorDisplay />}>
            {(pdfDocument) => (
              <PdfHighlighter
                pdfDocument={pdfDocument}
                enableAreaSelection={() => false}
                onScrollChange={() => {}}
                scrollRef={(scrollTo) => {
                  scrollRef.current = scrollTo;
                }}
                onSelectionFinished={() => null}
                highlightTransform={(highlight, index, setTip, hideTip, _viewportToScaled, _screenshot, isScrolledTo) => {
                  const chunk = chunks.find((c) => c.id === highlight.id);
                  const color = chunk ? getHighlightColor(chunk) : "#3B82F6";
                  console.log("[highlightTransform] Rendering:", {
                    index,
                    highlightId: highlight.id,
                    foundChunk: !!chunk,
                    color,
                    page: highlight.position.pageNumber,
                    rects: highlight.position.rects.length
                  });
                  return (
                    <ColoredHighlight
                      key={index}
                      highlight={highlight}
                      isScrolledTo={isScrolledTo}
                      color={color}
                      matchIndex={chunk?.matchIndex}
                      onClickHighlight={() => {
                        setTip(highlight, (h) => (
                          <HighlightTooltip highlight={h} color={color} />
                        ));
                      }}
                      onMouseOut={hideTip}
                    />
                  );
                }}
                highlights={highlights}
              />
            )}
          </PdfLoader>
          </div>
        </div>
      </div>
    );
  }
);

HighlightedPdfViewer.displayName = "HighlightedPdfViewer";
export default HighlightedPdfViewer;

function PdfLoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px] text-[#9a8f82] text-sm">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-[#c8873a] border-t-transparent rounded-full animate-spin" />
        Loading PDF…
      </div>
    </div>
  );
}

function PdfErrorDisplay() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px] text-red-600 text-sm">
      <div className="flex flex-col items-center gap-2 text-center px-4">
        <AlertTriangle className="w-8 h-8" />
        <p className="font-medium">Failed to load PDF</p>
        <p className="text-xs text-red-500 max-w-xs">
          Unable to load the document. Please try again or contact support if the problem persists.
        </p>
      </div>
    </div>
  );
}

function ColoredHighlight({
  highlight,
  isScrolledTo,
  color,
  matchIndex,
  onClickHighlight,
  onMouseOut,
}: {
  highlight: T_ViewportHighlight<IHighlight>;
  isScrolledTo: boolean;
  color: string;
  matchIndex?: number;
  onClickHighlight: () => void;
  onMouseOut: () => void;
}) {
  const firstRect = highlight.position.rects[0];
  return (
    <div style={{ position: "relative" }}>
      {/* Match index badge */}
      {matchIndex != null && firstRect && (
        <div
          style={{
            position: "absolute",
            left: `${firstRect.left}px`,
            top: `${firstRect.top - 8}px`,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "#1a1714",
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          {matchIndex}
        </div>
      )}
      {/* Render color overlay rects manually */}
      {highlight.position.rects.map((rect, i) => (
        <div
          key={i}
          onClick={onClickHighlight}
          onMouseOut={onMouseOut}
          style={{
            position: "absolute",
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            background: color,
            opacity: 0.35,
            cursor: "pointer",
            borderRadius: 2,
          }}
        />
      ))}
      {/* Use Highlight for scroll-to behavior and tooltip anchor */}
      <div style={{ opacity: 0, pointerEvents: "none", position: "absolute" }}>
        <Highlight
          isScrolledTo={isScrolledTo}
          position={highlight.position}
          comment={highlight.comment}
        />
      </div>
    </div>
  );
}

function HighlightTooltip({
  highlight,
  color,
}: {
  highlight: T_ViewportHighlight<IHighlight>;
  color: string;
}) {
  if (!highlight.comment?.text) return null;
  return (
    <div
      className="max-w-xs p-3 rounded-lg shadow-lg text-sm text-[#1a1714] bg-white border border-[#e0d9ce]"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      {highlight.comment.text}
    </div>
  );
}
