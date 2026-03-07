"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GitMerge, AlertTriangle, ChevronDown, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import type { HighlightedPdfViewerHandle, ComparedChunk } from "@/components/compare/HighlightedPdfViewer";
import ChangeSummaryPanel, { ComparisonMatch } from "@/components/compare/ChangeSummaryPanel";

// Lazy-load the PDF viewer to avoid SSR issues
const HighlightedPdfViewer = dynamic(
  () => import("@/components/compare/HighlightedPdfViewer"),
  { ssr: false }
);

type Contract = {
  id: string;
  name: string;
  type: string;
  file_url: string;
};

type ComparisonResult = {
  sameType: boolean;
  typeWarning: string | null;
  matches: ComparisonMatch[];
};

type ApiResponse = {
  comparison: ComparisonResult;
  chunksA: ComparedChunk[];
  chunksB: ComparedChunk[];
  comparisonId: string;
  signedUrlA: string;
  signedUrlB: string;
};

function buildViewerChunks(
  chunks: ComparedChunk[],
  matches: ComparisonMatch[],
  side: "A" | "B"
): ComparedChunk[] {
  console.log(`[buildViewerChunks ${side}] Input:`, {
    chunkCount: chunks.length,
    matchCount: matches.length,
    sampleChunkIds: chunks.slice(0, 3).map(c => c.id),
    sampleMatchChunkRefs: matches.slice(0, 3).map(m => ({ chunkA: m.chunkA, chunkB: m.chunkB }))
  });

  // Create a map to track which chunks have been assigned to which match
  // isPrimary: true for the originally matched chunk (shows badge), false for expanded chunks
  const chunkToMatchMap = new Map<string, { match: ComparisonMatch; matchIndex: number; isPrimary: boolean }>();
  
  // First pass: assign matches to their directly referenced chunks
  matches.forEach((match, matchIndex) => {
    const chunkId = side === "A" ? match.chunkA : match.chunkB;
    if (chunkId) {
      chunkToMatchMap.set(chunkId, { match, matchIndex: matchIndex + 1, isPrimary: true }); // 1-based indexing
    }
  });

  // Second pass: expand to nearby chunks (same section/topic)
  // Find chunks that are close to matched chunks (within same page and nearby Y position)
  const expandedChunks = new Set<string>();
  
  chunkToMatchMap.forEach((data, matchedChunkId) => {
    if (!data.isPrimary) return; // Only expand from primary chunks
    
    const matchedChunk = chunks.find(c => c.id === matchedChunkId);
    if (!matchedChunk) return;
    
    // Find all chunks on the same page that are nearby
    const samePageChunks = chunks.filter(c => 
      c.page === matchedChunk.page && 
      c.id !== matchedChunkId &&
      !chunkToMatchMap.has(c.id) // Don't override already matched chunks
    );
    
    // If the matched chunk is a title (short text), include content chunks below it
    const isTitle = matchedChunk.text.length < 50;
    
    samePageChunks.forEach(nearbyChunk => {
      const yDiff = nearbyChunk.y - matchedChunk.y;
      
      // For titles: include chunks within 200 points below
      // For content: include nearby chunks within 100 points
      const threshold = isTitle ? 200 : 100;
      
      if (yDiff > 0 && yDiff < threshold) {
        expandedChunks.add(nearbyChunk.id);
        chunkToMatchMap.set(nearbyChunk.id, { 
          match: data.match, 
          matchIndex: data.matchIndex,
          isPrimary: false // Expanded chunks don't show badge
        });
      }
    });
  });

  // Build the final result
  const result = chunks.map((chunk) => {
    const mapping = chunkToMatchMap.get(chunk.id);
    if (!mapping) return chunk;
    
    const { match, matchIndex, isPrimary } = mapping;
    return {
      ...chunk,
      riskLevel: side === "A" ? match.riskA : match.riskB,
      riskChange: match.riskChange,
      changeType: match.changeType,
      topic: match.topic,
      summary: match.summary,
      matchIndex: isPrimary ? matchIndex : undefined, // Only primary chunks show badge
    };
  });

  const enhancedCount = result.filter(c => c.riskLevel || c.riskChange || c.changeType).length;
  const primaryCount = result.filter(c => c.matchIndex).length;
  console.log(`[buildViewerChunks ${side}] Output:`, {
    totalChunks: result.length,
    enhancedWithRiskInfo: enhancedCount,
    primaryChunks: primaryCount,
    expandedChunks: expandedChunks.size,
    sampleEnhanced: result.filter(c => c.matchIndex).slice(0, 3).map(c => ({ 
      id: c.id, 
      matchIndex: c.matchIndex,
      riskLevel: c.riskLevel, 
      changeType: c.changeType 
    }))
  });

  return result;
}

export default function ComparePage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractA, setContractA] = useState<Contract | null>(null);
  const [contractB, setContractB] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [warningDismissed, setWarningDismissed] = useState(false);

  const viewerARef = useRef<HighlightedPdfViewerHandle>(null);
  const viewerBRef = useRef<HighlightedPdfViewerHandle>(null);
  const isSyncing = useRef(false);

  // Fetch user's contracts for the selectors
  useEffect(() => {
    fetch("/api/contracts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setContracts(data.filter((c) => c.file_url));
        else if (Array.isArray(data?.contracts)) setContracts(data.contracts.filter((c: Contract) => c.file_url));
      })
      .catch(() => {});
  }, []);

  const handleCompare = useCallback(async () => {
    if (!contractA || !contractB) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setWarningDismissed(false);

    try {
      const res = await fetch("/api/contracts/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractAUrl: contractA.file_url,
          contractBUrl: contractB.file_url,
          contractAId: contractA.id,
          contractBId: contractB.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }

      const data: ApiResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setLoading(false);
    }
  }, [contractA, contractB]);

  const handleSelectMatch = useCallback(
    (index: number) => {
      if (!result) return;
      const match = result.comparison.matches[index];
      if (match.chunkA) viewerARef.current?.scrollToChunk(match.chunkA);
      if (match.chunkB) viewerBRef.current?.scrollToChunk(match.chunkB);
    },
    [result]
  );

  // Sync scroll between left and right PDF viewers
  useEffect(() => {
    if (!result) return;
    // Small delay to let PdfHighlighter mount
    const timer = setTimeout(() => {
      const containerA = viewerARef.current?.getScrollContainer();
      const containerB = viewerBRef.current?.getScrollContainer();
      if (!containerA || !containerB) return;

      const handleScroll = (source: HTMLElement, target: HTMLElement) => () => {
        if (isSyncing.current) return;
        isSyncing.current = true;
        target.scrollTop = source.scrollTop;
        requestAnimationFrame(() => { isSyncing.current = false; });
      };

      const onScrollA = handleScroll(containerA, containerB);
      const onScrollB = handleScroll(containerB, containerA);
      containerA.addEventListener("scroll", onScrollA);
      containerB.addEventListener("scroll", onScrollB);

      return () => {
        containerA.removeEventListener("scroll", onScrollA);
        containerB.removeEventListener("scroll", onScrollB);
      };
    }, 1000);
    return () => clearTimeout(timer);
  }, [result]);

  const chunksA = result
    ? buildViewerChunks(result.chunksA, result.comparison.matches, "A")
    : [];
  const chunksB = result
    ? buildViewerChunks(result.chunksB, result.comparison.matches, "B")
    : [];

  const showWarning =
    result && !result.comparison.sameType && !warningDismissed;

  return (
    <div className="flex flex-col h-full bg-[#F8F7F4]">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-[#e0d9ce] bg-white px-4 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-[#1a1714] font-semibold text-sm mr-2">
            <GitMerge className="w-4 h-4 text-[#c8873a]" />
            Compare Contracts
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 w-full">
            <ContractSelector
              contracts={contracts}
              value={contractA}
              onChange={setContractA}
              placeholder="Contract A"
              exclude={contractB?.id}
            />

            <span className="text-[#9a8f82] text-xs font-medium hidden sm:block">vs</span>

            <ContractSelector
              contracts={contracts}
              value={contractB}
              onChange={setContractB}
              placeholder="Contract B"
              exclude={contractA?.id}
            />

            <button
              onClick={handleCompare}
              disabled={!contractA || !contractB || loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1714] text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2d2a27] transition-colors flex-shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Comparing…
                </>
              ) : (
                <>
                  <GitMerge className="w-4 h-4" />
                  Compare
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Warning banner */}
      {showWarning && (
        <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-amber-800">
            <span className="font-semibold">Different contract types detected.</span>{" "}
            {result.comparison.typeWarning || "These contracts may be different types — comparison results may be less accurate."}
          </div>
          <button
            onClick={() => setWarningDismissed(true)}
            className="text-xs text-amber-600 hover:text-amber-800 font-medium flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex-shrink-0 bg-red-50 border-b border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main content */}
      {!result && !loading && (
        <EmptyState hasContracts={contracts.length > 0} />
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-[#9a8f82]">
            <Loader2 className="w-8 h-8 animate-spin text-[#c8873a]" />
            <p className="text-sm">Extracting and comparing contracts…</p>
            <p className="text-xs">This may take up to 30 seconds</p>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1fr_300px] min-h-0 overflow-hidden">
          {/* Contract A PDF */}
          <div className="min-h-0 overflow-hidden border-r border-[#e0d9ce]">
            <HighlightedPdfViewer
              ref={viewerARef}
              pdfUrl={`/api/pdf-proxy?url=${encodeURIComponent(result.signedUrlA)}`}
              chunks={chunksA}
              label={`Contract A — ${contractA!.name}`}
            />
          </div>

          {/* Contract B PDF */}
          <div className="min-h-0 overflow-hidden border-r border-[#e0d9ce]">
            <HighlightedPdfViewer
              ref={viewerBRef}
              pdfUrl={`/api/pdf-proxy?url=${encodeURIComponent(result.signedUrlB)}`}
              chunks={chunksB}
              label={`Contract B — ${contractB!.name}`}
            />
          </div>

          {/* Summary panel */}
          <div className="min-h-0 overflow-hidden">
            <ChangeSummaryPanel
              matches={result.comparison.matches}
              onSelectMatch={handleSelectMatch}
              chunksA={result.chunksA}
              chunksB={result.chunksB}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ContractSelector({
  contracts,
  value,
  onChange,
  placeholder,
  exclude,
}: {
  contracts: Contract[];
  value: Contract | null;
  onChange: (c: Contract | null) => void;
  placeholder: string;
  exclude?: string;
}) {
  const available = contracts.filter((c) => c.id !== exclude);

  return (
    <div className="relative flex-1 w-full min-w-[160px] max-w-xs">
      <select
        value={value?.id ?? ""}
        onChange={(e) => {
          const selected = available.find((c) => c.id === e.target.value) ?? null;
          onChange(selected);
        }}
        className="w-full appearance-none bg-[#F8F7F4] border border-[#e0d9ce] rounded-lg px-3 py-2 pr-8 text-sm text-[#1a1714] focus:outline-none focus:border-[#c8873a] transition-colors cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {available.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.type || "Contract"})
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9a8f82] pointer-events-none" />
    </div>
  );
}

function EmptyState({ hasContracts }: { hasContracts: boolean }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        <div className="w-14 h-14 rounded-2xl bg-[#f5f0e8] flex items-center justify-center mx-auto mb-4">
          <GitMerge className="w-7 h-7 text-[#c8873a]" />
        </div>
        <h3 className="text-base font-semibold text-[#1a1714] mb-2">Compare two contracts</h3>
        <p className="text-sm text-[#9a8f82]">
          {hasContracts
            ? "Select two contracts above and click Compare to see AI-powered risk highlights and a change summary."
            : "Upload contracts first, then come back to compare them side by side."}
        </p>
      </div>
    </div>
  );
}
