"use client";

export type ComparisonMatch = {
  topic: string;
  chunkA: string | null;
  chunkB: string | null;
  changeType: "modified" | "added" | "removed" | "unchanged";
  riskA: "high" | "medium" | "low" | "none";
  riskB: "high" | "medium" | "low" | "none";
  riskChange: "increased" | "decreased" | "same" | "new" | "removed";
  summary: string;
};

type Group = {
  label: string;
  color: string;
  bg: string;
  items: Array<{ match: ComparisonMatch; index: number }>;
};

type Props = {
  matches: ComparisonMatch[];
  onSelectMatch: (index: number) => void;
};

function groupMatches(matches: ComparisonMatch[]): Group[] {
  const groups: Group[] = [
    { label: "Risk Increased", color: "#FF8C00", bg: "#FFF3E0", items: [] },
    { label: "High Risk", color: "#FF4444", bg: "#FFF0F0", items: [] },
    { label: "New Clauses", color: "#6B7280", bg: "#F3F4F6", items: [] },
    { label: "Removed Clauses", color: "#6B7280", bg: "#F3F4F6", items: [] },
    { label: "Risk Decreased", color: "#22C55E", bg: "#F0FFF4", items: [] },
    { label: "Modified", color: "#3B82F6", bg: "#EFF6FF", items: [] },
  ];

  matches.forEach((match, index) => {
    if (match.riskChange === "increased") {
      groups[0].items.push({ match, index });
    } else if (match.riskB === "high" || match.riskA === "high") {
      groups[1].items.push({ match, index });
    } else if (match.changeType === "added") {
      groups[2].items.push({ match, index });
    } else if (match.changeType === "removed") {
      groups[3].items.push({ match, index });
    } else if (match.riskChange === "decreased") {
      groups[4].items.push({ match, index });
    } else if (match.changeType === "modified") {
      groups[5].items.push({ match, index });
    }
  });

  return groups.filter((g) => g.items.length > 0);
}

const RISK_CHANGE_LABELS: Record<string, string> = {
  increased: "Risk ↑",
  decreased: "Risk ↓",
  same: "Same",
  new: "New",
  removed: "Removed",
};

export default function ChangeSummaryPanel({ matches, onSelectMatch }: Props) {
  const groups = groupMatches(matches);
  const changedCount = matches.filter((m) => m.changeType !== "unchanged").length;

  return (
    <div className="flex flex-col h-full bg-[#F8F7F4] border-l border-[#e0d9ce]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#e0d9ce] flex-shrink-0">
        <h3 className="text-sm font-semibold text-[#1a1714]">Change Summary</h3>
        <p className="text-xs text-[#9a8f82] mt-0.5">
          {changedCount} change{changedCount !== 1 ? "s" : ""} detected
        </p>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b border-[#e0d9ce] flex-shrink-0 space-y-1">
        {[
          { color: "#FF4444", label: "High risk clause" },
          { color: "#FF8C00", label: "Risk increased" },
          { color: "#22C55E", label: "Risk decreased" },
          { color: "#3B82F6", label: "Changed (neutral)" },
          { color: "#6B7280", label: "Only in one contract" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-[#6B7280]">
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            {label}
          </div>
        ))}
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {groups.length === 0 && (
          <p className="text-sm text-[#9a8f82] text-center py-8">No differences found</p>
        )}
        {groups.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: group.color }}
              />
              <span className="text-xs font-semibold text-[#1a1714] uppercase tracking-wide">
                {group.label}
              </span>
              <span className="ml-auto text-xs text-[#9a8f82]">{group.items.length}</span>
            </div>

            <div className="space-y-1.5">
              {group.items.map(({ match, index }) => (
                <button
                  key={index}
                  onClick={() => onSelectMatch(index)}
                  className="w-full text-left rounded-lg border border-[#e0d9ce] bg-white px-3 py-2.5 hover:border-[#c8873a] hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ backgroundColor: group.bg, color: group.color }}
                    >
                      {RISK_CHANGE_LABELS[match.riskChange] ?? match.riskChange}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#1a1714] truncate">{match.topic}</p>
                      <p className="text-xs text-[#9a8f82] mt-0.5 line-clamp-2">{match.summary}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
