"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  Plus,
  Settings,
  Check,
  Loader2,
  X,
} from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  plan: "free" | "solo" | "pro" | "business";
  memberCount: number;
  contractCount: number;
  isActive?: boolean;
}

const getPlanBadge = (plan: Workspace["plan"]) => {
  const styles = {
    free: "bg-gray-100 text-gray-600",
    solo: "bg-blue-100 text-blue-700",
    pro: "bg-purple-100 text-purple-700",
    business: "bg-amber-100 text-amber-700",
  };
  return styles[plan] || styles.free;
};

export default function WorkspaceSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workspaces");
      if (res.ok) {
        const data = await res.json();
        const ws: Workspace[] = Array.isArray(data) ? data : [];
        setWorkspaces(ws);

        // Restore active workspace from localStorage or default to first
        const savedId = localStorage.getItem("activeWorkspaceId");
        if (savedId && ws.find((w) => w.id === savedId)) {
          setActiveWorkspaceId(savedId);
        } else if (ws.length > 0) {
          setActiveWorkspaceId(ws[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load workspaces:", err);
      setError("Could not load workspaces");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    localStorage.setItem("activeWorkspaceId", workspaceId);
    setIsOpen(false);
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
      });

      if (res.ok) {
        const newWs = await res.json();
        setWorkspaces((prev) => [...prev, newWs]);
        setActiveWorkspaceId(newWs.id);
        localStorage.setItem("activeWorkspaceId", newWs.id);
        setNewWorkspaceName("");
        setShowCreateForm(false);
        setIsOpen(false);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create workspace");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <Loader2 className="w-4 h-4 animate-spin text-[#9CA3AF]" />
        <span className="text-sm text-[#9CA3AF]">Loading...</span>
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <button
        onClick={() => { setIsOpen(true); setShowCreateForm(true); }}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F3F4F6] transition-colors"
      >
        <div className="w-10 h-10 rounded-lg border-2 border-dashed border-[#D1D5DB] flex items-center justify-center">
          <Plus className="w-4 h-4 text-[#9CA3AF]" />
        </div>
        <span className="text-sm text-[#374151]">Create Workspace</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F3F4F6] transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white font-semibold">
          {activeWorkspace.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 text-left">
          <p className="font-medium text-[#1A1A1A] text-sm truncate max-w-[120px]">
            {activeWorkspace.name}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${getPlanBadge(
                activeWorkspace.plan
              )}`}
            >
              {activeWorkspace.plan}
            </span>
            <span className="text-xs text-[#9CA3AF]">
              {activeWorkspace.contractCount} contracts
            </span>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-[#6B7280] transition-transform flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setShowCreateForm(false); }} />

          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-[#E5E7EB] shadow-lg z-50 overflow-hidden">
            <div className="p-2">
              <p className="text-xs font-medium text-[#6B7280] px-3 py-2 uppercase tracking-wide">
                Your Workspaces
              </p>

              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => handleSwitch(workspace.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    workspace.id === activeWorkspaceId
                      ? "bg-[#FEF3C7]"
                      : "hover:bg-[#F3F4F6]"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold ${
                      workspace.id === activeWorkspaceId
                        ? "bg-gradient-to-br from-[#F59E0B] to-[#D97706]"
                        : "bg-gradient-to-br from-[#6B7280] to-[#4B5563]"
                    }`}
                  >
                    {workspace.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 text-left">
                    <p className="font-medium text-[#1A1A1A] text-sm truncate">
                      {workspace.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-1 py-0.5 rounded font-medium uppercase ${getPlanBadge(
                          workspace.plan
                        )}`}
                      >
                        {workspace.plan}
                      </span>
                      <span className="text-[10px] text-[#9CA3AF]">
                        {workspace.memberCount} member{workspace.memberCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {workspace.id === activeWorkspaceId && (
                    <Check className="w-4 h-4 text-[#F59E0B]" />
                  )}
                </button>
              ))}
            </div>

            <hr className="border-[#E5E7EB]" />

            <div className="p-2">
              {!showCreateForm ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateForm(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F3F4F6] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg border-2 border-dashed border-[#D1D5DB] flex items-center justify-center">
                    <Plus className="w-4 h-4 text-[#9CA3AF]" />
                  </div>
                  <span className="text-sm text-[#374151]">Create New Workspace</span>
                </button>
              ) : (
                <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateWorkspace();
                        if (e.key === "Escape") setShowCreateForm(false);
                      }}
                      placeholder="Workspace name..."
                      autoFocus
                      className="flex-1 px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#F59E0B]"
                    />
                    <button
                      onClick={handleCreateWorkspace}
                      disabled={!newWorkspaceName.trim() || creating}
                      className="px-3 py-1.5 bg-[#F59E0B] text-white text-sm rounded-lg hover:bg-[#D97706] disabled:opacity-50"
                    >
                      {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create"}
                    </button>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="p-1.5 text-[#9CA3AF] hover:text-[#374151]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {error && <p className="text-xs text-red-500">{error}</p>}
                </div>
              )}

              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F3F4F6] transition-colors">
                <Settings className="w-4 h-4 text-[#6B7280]" />
                <span className="text-sm text-[#374151]">Workspace Settings</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
