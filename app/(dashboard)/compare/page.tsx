"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GitMerge, AlertTriangle, ChevronDown, Loader2, Sparkles, ArrowUpRight } from "lucide-react";
import dynamic from "next/dynamic";
import type { HighlightedPdfViewerHandle, ComparedChunk } from "@/components/compare/HighlightedPdfViewer";
import ChangeSummaryPanel, { ComparisonMatch } from "@/components/compare/ChangeSummaryPanel";
import CompareHistory, { CompareHistoryItem } from "@/components/compare/CompareHistory";

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
  const chunkToMatchMap = new Map<string, { match: ComparisonMatch; matchIndex: number; isPrimary: boolean }>();
  
  // First pass: assign matches to their directly referenced chunks
  matches.forEach((match, idx) => {
    const chunkId = side === "A" ? match.chunkA : match.chunkB;
    if (chunkId && chunks.some(c => c.id === chunkId)) {
      chunkToMatchMap.set(chunkId, { match, matchIndex: idx + 1, isPrimary: true });
    }
  });

  // Second pass: expand to nearby chunks (same section/topic)
  const expansions: { chunkId: string; match: ComparisonMatch; matchIndex: number }[] = [];
  
  chunkToMatchMap.forEach((data, matchedChunkId) => {
    if (!data.isPrimary) return;
    const matchedChunk = chunks.find(c => c.id === matchedChunkId);
    if (!matchedChunk) return;
    
    const samePageChunks = chunks.filter(c => 
      c.page === matchedChunk.page && 
      c.id !== matchedChunkId &&
      !chunkToMatchMap.has(c.id)
    );
    
    const isTitle = matchedChunk.text.length < 60;
    
    samePageChunks.forEach(nearbyChunk => {
      const yDiff = nearbyChunk.y - matchedChunk.y;
      const xDiff = Math.abs(nearbyChunk.x - matchedChunk.x);
      const downThreshold = isTitle ? 200 : 120;
      const upThreshold = 40;
      const xThreshold = 100; // avoid bleeding into adjacent columns

      if (xDiff < xThreshold && ((yDiff > 0 && yDiff < downThreshold) || (yDiff < 0 && yDiff > -upThreshold))) {
        expansions.push({ chunkId: nearbyChunk.id, match: data.match, matchIndex: data.matchIndex });
      }
    });
  });
  
  expansions.forEach(({ chunkId, match, matchIndex }) => {
    if (!chunkToMatchMap.has(chunkId)) {
      chunkToMatchMap.set(chunkId, { match, matchIndex, isPrimary: false });
    }
  });

  return chunks.map((chunk) => {
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
      matchIndex: isPrimary ? matchIndex : undefined,
    };
  });
}

export default function ComparePage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractA, setContractA] = useState<Contract | null>(null);
  const [contractB, setContractB] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [warningDismissed, setWarningDismissed] = useState(false);

  // History state
  const [history, setHistory] = useState<CompareHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loadingHistoryId, setLoadingHistoryId] = useState<string | null>(null);

  // Quota state
  const [comparisonsUsed, setComparisonsUsed] = useState(0);
  const [comparisonsLimit, setComparisonsLimit] = useState(0);

  // Labels for history-loaded comparisons
  const [labelA, setLabelA] = useState<string>("");
  const [labelB, setLabelB] = useState<string>("");

  const viewerARef = useRef<HighlightedPdfViewerHandle>(null);
  const viewerBRef = useRef<HighlightedPdfViewerHandle>(null);
  const isSyncing = useRef(false);

  // Fetch contracts + history on mount
  useEffect(() => {
    fetch("/api/contracts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setContracts(data.filter((c) => c.file_url));
        else if (Array.isArray(data?.contracts)) setContracts(data.contracts.filter((c: Contract) => c.file_url));
      })
      .catch(() => {});

    fetchHistory();
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/contracts/compare");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        setComparisonsUsed(data.comparisonsUsed ?? 0);
        setComparisonsLimit(data.comparisonsLimit ?? 0);
      }
    } catch { /* ignore */ }
    setHistoryLoading(false);
  }, []);

  const handleCompare = useCallback(async () => {
    if (!contractA || !contractB) return;

    // Check quota client-side (skip if limit hasn't loaded yet)
    if (comparisonsLimit > 0 && comparisonsUsed >= comparisonsLimit) {
      setError("COMPARISON_LIMIT_REACHED");
      return;
    }

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
        if (err.error === "COMPARISON_LIMIT_REACHED") {
          setError("COMPARISON_LIMIT_REACHED");
          setComparisonsUsed(err.comparisonsUsed ?? comparisonsUsed);
          setComparisonsLimit(err.comparisonsLimit ?? comparisonsLimit);
        } else {
          throw new Error(err.error || `Error ${res.status}`);
        }
        return;
      }

      const data: ApiResponse = await res.json();
      setResult(data);
      setLabelA(contractA.name);
      setLabelB(contractB.name);
      setComparisonsUsed(prev => prev + 1);
      // Refresh history
      fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setLoading(false);
    }
  }, [contractA, contractB, comparisonsUsed, comparisonsLimit, fetchHistory]);

  const handleLoadHistory = useCallback(async (comparisonId: string) => {
    setLoadingHistoryId(comparisonId);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/contracts/compare?id=${comparisonId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load comparison");
      }

      const data: ApiResponse = await res.json();
      setResult(data);
      setWarningDismissed(false);

      // Find history item to set labels
      const item = history.find(h => h.id === comparisonId);
      if (item) {
        setLabelA(item.contractAName);
        setLabelB(item.contractBName);
        // Auto-select contracts in dropdowns if available
        const cA = contracts.find(c => c.id === item.contractAId);
        const cB = contracts.find(c => c.id === item.contractBId);
        if (cA) setContractA(cA);
        if (cB) setContractB(cB);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load comparison");
    } finally {
      setLoadingHistoryId(null);
    }
  }, [history, contracts]);

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

    let containerA: HTMLElement | null = null;
    let containerB: HTMLElement | null = null;
    let onScrollA: (() => void) | null = null;
    let onScrollB: (() => void) | null = null;

    const timer = setTimeout(() => {
      containerA = viewerARef.current?.getScrollContainer() ?? null;
      containerB = viewerBRef.current?.getScrollContainer() ?? null;
      if (!containerA || !containerB) return;

      onScrollA = () => {
        if (isSyncing.current) return;
        isSyncing.current = true;
        containerB!.scrollTop = containerA!.scrollTop;
        requestAnimationFrame(() => { isSyncing.current = false; });
      };
      onScrollB = () => {
        if (isSyncing.current) return;
        isSyncing.current = true;
        containerA!.scrollTop = containerB!.scrollTop;
        requestAnimationFrame(() => { isSyncing.current = false; });
      };

      containerA.addEventListener("scroll", onScrollA);
      containerB.addEventListener("scroll", onScrollB);
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (containerA && onScrollA) containerA.removeEventListener("scroll", onScrollA);
      if (containerB && onScrollB) containerB.removeEventListener("scroll", onScrollB);
    };
  }, [result]);

  const chunksA = result
    ? buildViewerChunks(result.chunksA, result.comparison.matches, "A")
    : [];
  const chunksB = result
    ? buildViewerChunks(result.chunksB, result.comparison.matches, "B")
    : [];

  const showWarning = result && !result.comparison.sameType && !warningDismissed;
  const isOverQuota = error === "COMPARISON_LIMIT_REACHED";
  const remaining = Math.max(comparisonsLimit - comparisonsUsed, 0);

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
                  Comparing...
                </>
              ) : (
                <>
                  <GitMerge className="w-4 h-4" />
                  Compare
                </>
              )}
            </button>

            {/* Quota badge */}
            {comparisonsLimit > 0 && (
              <span className={`text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                remaining === 0
                  ? "bg-red-50 text-red-600"
                  : remaining <= 1
                  ? "bg-amber-50 text-amber-600"
                  : "bg-[#f5f0e8] text-[#9a8f82]"
              }`}>
                {remaining}/{comparisonsLimit} remaining
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quota exceeded banner */}
      {isOverQuota && (
        <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-amber-800">
            <span className="font-semibold">Comparison limit reached.</span>{" "}
            You&apos;ve used all {comparisonsLimit} comparison{comparisonsLimit !== 1 ? "s" : ""} on your current plan.
            Upgrade to get more comparisons per month.
          </div>
          <a
            href="/settings?tab=billing"
            className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors"
          >
            Upgrade
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Warning banner */}
      {showWarning && (
        <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-amber-800">
            <span className="font-semibold">Different contract types detected.</span>{" "}
            {result!.comparison.typeWarning || "These contracts may be different types — comparison results may be less accurate."}
          </div>
          <button
            onClick={() => setWarningDismissed(true)}
            className="text-xs text-amber-600 hover:text-amber-800 font-medium flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error (non-quota) */}
      {error && !isOverQuota && (
        <div className="flex-shrink-0 bg-red-50 border-b border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main content: History or Results */}
      {!result && !loading && (
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <CompareHistory
              history={history}
              loading={historyLoading}
              onSelect={handleLoadHistory}
              loadingId={loadingHistoryId}
            />
          </div>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-[#9a8f82]">
            <Loader2 className="w-8 h-8 animate-spin text-[#c8873a]" />
            <p className="text-sm">Extracting and comparing contracts...</p>
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
              label={`Contract A — ${labelA || contractA?.name || "Unknown"}`}
            />
          </div>

          {/* Contract B PDF */}
          <div className="min-h-0 overflow-hidden border-r border-[#e0d9ce]">
            <HighlightedPdfViewer
              ref={viewerBRef}
              pdfUrl={`/api/pdf-proxy?url=${encodeURIComponent(result.signedUrlB)}`}
              chunks={chunksB}
              label={`Contract B — ${labelB || contractB?.name || "Unknown"}`}
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
