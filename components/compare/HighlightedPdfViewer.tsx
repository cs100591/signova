"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
import { PdfHighlighter, PdfLoader, Highlight } from "react-pdf-highlighter";
import type { IHighlight } from "react-pdf-highlighter";
import type { T_ViewportHighlight } from "react-pdf-highlighter/dist/components/PdfHighlighter";

export type ComparedChunk = {
  id: string;
  text: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  riskLevel?: "high" | "medium" | "low" | "none";
  riskChange?: "increased" | "decreased" | "same" | "new" | "removed";
  changeType?: "modified" | "added" | "removed" | "unchanged";
  topic?: string;
  summary?: string;
};

export type HighlightedPdfViewerHandle = {
  scrollToChunk: (chunkId: string) => void;
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
  return chunks
    .filter((c) => getHighlightColor(c) !== "transparent")
    .map((chunk) => ({
      id: chunk.id,
      content: { text: chunk.text },
      comment: { text: chunk.summary || chunk.topic || "", emoji: "" },
      position: {
        boundingRect: {
          x1: chunk.x,
          y1: chunk.y,
          x2: chunk.x + chunk.width,
          y2: chunk.y + chunk.height,
          width: 612, // standard PDF width in pts
          height: 792,
          pageNumber: chunk.page,
        },
        rects: [
          {
            x1: chunk.x,
            y1: chunk.y,
            x2: chunk.x + chunk.width,
            y2: chunk.y + chunk.height,
            width: 612,
            height: 792,
            pageNumber: chunk.page,
          },
        ],
        pageNumber: chunk.page,
      },
    }));
}

const HighlightedPdfViewer = forwardRef<HighlightedPdfViewerHandle, Props>(
  ({ pdfUrl, chunks, label }, ref) => {
    const scrollRef = useRef<(highlight: IHighlight) => void>(() => {});
    const highlights = chunksToHighlights(chunks);

    useImperativeHandle(ref, () => ({
      scrollToChunk(chunkId: string) {
        const h = highlights.find((h) => h.id === chunkId);
        if (h) scrollRef.current(h);
      },
    }));

    return (
      <div className="flex flex-col h-full min-h-0">
        {label && (
          <div className="px-3 py-2 border-b border-[#e0d9ce] bg-[#f5f0e8] text-sm font-medium text-[#1a1714] flex-shrink-0">
            {label}
          </div>
        )}
        <div className="flex-1 relative overflow-hidden">
          <PdfLoader url={pdfUrl} beforeLoad={<PdfLoadingSpinner />}>
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
                  return (
                    <ColoredHighlight
                      key={index}
                      highlight={highlight}
                      isScrolledTo={isScrolledTo}
                      color={color}
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

function ColoredHighlight({
  highlight,
  isScrolledTo,
  color,
  onClickHighlight,
  onMouseOut,
}: {
  highlight: T_ViewportHighlight<IHighlight>;
  isScrolledTo: boolean;
  color: string;
  onClickHighlight: () => void;
  onMouseOut: () => void;
}) {
  return (
    <div style={{ position: "relative" }}>
      {/* Render color overlay rects manually */}
      {highlight.position.rects.map((rect, i) => (
        <div
          key={i}
          onClick={onClickHighlight}
          onMouseOut={onMouseOut}
          style={{
            position: "absolute",
            left: `${rect.left}%`,
            top: `${rect.top}%`,
            width: `${rect.width}%`,
            height: `${rect.height}%`,
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
