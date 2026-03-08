"use client";

import { GitMerge, Clock, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";

export type CompareHistoryItem = {
  id: string;
  contractAId: string | null;
  contractBId: string | null;
  contractAName: string;
  contractBName: string;
  status: "pending" | "processing" | "done" | "error";
  matchCount: number;
  similarityWarning: boolean;
  createdAt: string;
};

type Props = {
  history: CompareHistoryItem[];
  loading: boolean;
  onSelect: (id: string) => void;
  loadingId?: string | null;
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function StatusBadge({ status }: { status: string }) {
  if (status === "done") {
    return (
      <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
        <CheckCircle className="w-3 h-3" />
        Done
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1 text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-medium">
        <XCircle className="w-3 h-3" />
        Error
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
      <Loader2 className="w-3 h-3 animate-spin" />
      Processing
    </span>
  );
}

export default function CompareHistory({ history, loading, onSelect, loadingId }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[#9a8f82]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading history...</span>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-12 h-12 rounded-2xl bg-[#f5f0e8] flex items-center justify-center mx-auto mb-3">
          <GitMerge className="w-6 h-6 text-[#c8873a]" />
        </div>
        <h3 className="text-sm font-semibold text-[#1a1714] mb-1">No comparisons yet</h3>
        <p className="text-xs text-[#9a8f82]">
          Select two contracts above and click Compare to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Clock className="w-3.5 h-3.5 text-[#9a8f82]" />
        <h3 className="text-xs font-semibold text-[#9a8f82] uppercase tracking-wide">Recent Comparisons</h3>
      </div>

      <div className="space-y-2">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => item.status === "done" && onSelect(item.id)}
            disabled={item.status !== "done" || loadingId === item.id}
            className="w-full text-left rounded-lg border border-[#e0d9ce] bg-white px-3 py-2.5 hover:border-[#c8873a] hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-medium text-[#1a1714] truncate max-w-[120px]">
                    {item.contractAName}
                  </span>
                  <span className="text-[10px] text-[#9a8f82] flex-shrink-0">vs</span>
                  <span className="text-xs font-medium text-[#1a1714] truncate max-w-[120px]">
                    {item.contractBName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.status} />
                  {item.status === "done" && (
                    <span className="text-[10px] text-[#9a8f82]">
                      {item.matchCount} change{item.matchCount !== 1 ? "s" : ""}
                    </span>
                  )}
                  {item.similarityWarning && (
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                <span className="text-[10px] text-[#9a8f82]">{timeAgo(item.createdAt)}</span>
                {loadingId === item.id && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c8873a]" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
