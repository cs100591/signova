"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus, Check, Loader2, X } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  plan: string;
  memberCount: number;
  contractCount: number;
}

export default function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);
  useEffect(() => { if (showForm) inputRef.current?.focus(); }, [showForm]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workspaces");
      if (res.ok) {
        const data: Workspace[] = await res.json();
        setWorkspaces(Array.isArray(data) ? data : []);
        const saved = localStorage.getItem("activeWorkspaceId");
        if (saved && data.find(w => w.id === saved)) {
          setActiveId(saved);
        } else if (data.length > 0) {
          setActiveId(data[0].id);
        }
      }
    } catch (e) {
      console.error("[WorkspaceSwitcher] load failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    if (!name.trim()) { setError("Enter a workspace name"); return; }
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const body = await res.json();
      if (!res.ok) { setError(body.error || `Error ${res.status}`); return; }
      setWorkspaces(prev => [...prev, body]);
      setActiveId(body.id);
      localStorage.setItem("activeWorkspaceId", body.id);
      setName("");
      setShowForm(false);
      setIsOpen(false);
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setCreating(false);
    }
  };

  const active = workspaces.find(w => w.id === activeId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-sm text-[#9CA3AF]">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading...
      </div>
    );
  }

  // ── No workspaces yet: show inline create form ───────────────────────────
  if (!active) {
    return (
      <div className="px-2 py-1">
        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 border-dashed border-[#D1D5DB] hover:border-[#F59E0B] hover:bg-[#FEF3C7]/30 transition-all"
          >
            <div className="w-8 h-8 rounded-lg border-2 border-dashed border-[#D1D5DB] flex items-center justify-center">
              <Plus className="w-4 h-4 text-[#9CA3AF]" />
            </div>
            <span className="text-sm text-[#374151] font-medium">Create Workspace</span>
          </button>
        ) : (
          <div className="space-y-2 px-1">
            <p className="text-xs text-[#6B7280] font-medium">New workspace</p>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") create(); if (e.key === "Escape") setShowForm(false); }}
              placeholder="e.g. Acme Corp"
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#F59E0B]"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={create}
                disabled={creating || !name.trim()}
                className="flex-1 py-1.5 bg-[#F59E0B] text-white text-sm rounded-lg hover:bg-[#D97706] disabled:opacity-50 font-medium"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setName(""); setError(""); }}
                className="px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Has workspaces: dropdown switcher ────────────────────────────────────
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setIsOpen(o => !o); setShowForm(false); }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {active.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-[#1A1A1A] truncate">{active.name}</p>
          <p className="text-xs text-[#9CA3AF]">{active.contractCount} contracts</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#9CA3AF] transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setShowForm(false); }} />

          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-[#E5E7EB] shadow-lg z-50 overflow-hidden">
            <div className="p-2 max-h-[240px] overflow-y-auto">
              {workspaces.map(ws => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => { setActiveId(ws.id); localStorage.setItem("activeWorkspaceId", ws.id); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${ws.id === activeId ? "bg-[#FEF3C7]" : "hover:bg-[#F3F4F6]"}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold ${ws.id === activeId ? "bg-[#F59E0B]" : "bg-[#6B7280]"}`}>
                    {ws.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-left text-sm text-[#1A1A1A] truncate">{ws.name}</span>
                  {ws.id === activeId && <Check className="w-4 h-4 text-[#F59E0B]" />}
                </button>
              ))}
            </div>

            <div className="border-t border-[#E5E7EB] p-2">
              {!showForm ? (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setShowForm(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F3F4F6] transition-colors text-sm text-[#374151]"
                >
                  <Plus className="w-4 h-4" /> New Workspace
                </button>
              ) : (
                <div className="px-1 py-1 space-y-2" onClick={e => e.stopPropagation()}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") create(); if (e.key === "Escape") setShowForm(false); }}
                    placeholder="Workspace name..."
                    autoFocus
                    className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#F59E0B]"
                  />
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={create}
                      disabled={creating || !name.trim()}
                      className="flex-1 py-1.5 bg-[#F59E0B] text-white text-xs rounded-lg hover:bg-[#D97706] disabled:opacity-50 font-medium"
                    >
                      {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Create"}
                    </button>
                    <button type="button" onClick={() => { setShowForm(false); setName(""); setError(""); }} className="px-2 py-1.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
