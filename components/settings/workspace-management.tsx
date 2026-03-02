"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronDown, ChevronRight, Mail, CheckCircle2, User, Copy, Trash2, Building2 } from "lucide-react";
import { supabaseClient } from "@/lib/supabase";

interface WorkspaceDetail {
  id: string;
  name: string;
  role: string;
  members: any[];
  invitations: any[];
  contracts: any[];
}

export default function WorkspaceManagement() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [details, setDetails] = useState<Record<string, WorkspaceDetail>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");

  // Delete modal state
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [deleteOption, setDeleteOption] = useState<"move" | "delete">("move");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch("/api/workspaces");
      if (res.ok) {
        const data = await res.json();
        // filter out personal space
        const ws = data.filter((w: any) => w.id !== 'personal');
        setWorkspaces(ws);
        if (ws.length > 0 && !expandedId) {
          toggleExpand(ws[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (id: string) => {
    setLoadingDetails(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/workspaces/${id}/details`);
      if (res.ok) {
        const data = await res.json();
        setDetails(prev => ({ 
          ...prev, 
          [id]: {
            id,
            name: data.workspace.name,
            role: data.userRole,
            members: data.members,
            invitations: data.invitations,
            contracts: data.contracts
          }
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [id]: false }));
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!details[id]) {
        fetchDetails(id);
      }
    }
  };

  const handleInvite = async (workspaceId: string) => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setInviteMsg("Please enter a valid email");
      return;
    }
    
    setInviting(true);
    setInviteMsg("");
    
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invite");
      
      setInviteMsg(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      fetchDetails(workspaceId);
    } catch (e: any) {
      setInviteMsg(e.message || "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const copyInviteLink = async (workspaceId: string) => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites/link`, {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const link = `${window.location.origin}/invite/${data.token}`;
      await navigator.clipboard.writeText(link);
      alert("Invite link copied to clipboard!");
    } catch (e: any) {
      alert("Failed to generate link: " + e.message);
    }
  };

  const handleRemoveContract = async (contractId: string, workspaceId: string) => {
    if (!confirm("Remove this contract from the workspace? It will move back to your Personal Space.")) return;
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: null })
      });
      if (!res.ok) throw new Error("Failed to remove contract");
      
      // Update local state
      setDetails(prev => ({
        ...prev,
        [workspaceId]: {
          ...prev[workspaceId],
          contracts: prev[workspaceId].contracts.filter((c: any) => c.id !== contractId)
        }
      }));
      
      window.dispatchEvent(new Event('workspaceUpdate'));
    } catch (e) {
      alert("Failed to remove contract");
    }
  };

  const handleDeleteWorkspace = (workspaceId: string) => {
    setDeleteModalId(workspaceId);
    setDeleteOption("move");
  };

  const confirmDeleteWorkspace = async () => {
    if (!deleteModalId) return;
    setIsDeleting(true);
    
    try {
      const res = await fetch(`/api/workspaces/${deleteModalId}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractAction: deleteOption })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete");
      }
      
      setWorkspaces(prev => prev.filter(w => w.id !== deleteModalId));
      if (expandedId === deleteModalId) setExpandedId(null);
      
      if (localStorage.getItem("activeWorkspaceId") === deleteModalId) {
        localStorage.setItem("activeWorkspaceId", "personal");
        window.dispatchEvent(new Event('workspaceChange'));
      }
      window.dispatchEvent(new Event('workspaceUpdate'));
      setDeleteModalId(null);
      
    } catch (e: any) {
      alert(e.message || "Error deleting workspace");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#F59E0B]" /></div>;

  if (workspaces.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center">
        <Building2 className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">No Workspaces</h3>
        <p className="text-sm text-[#6B7280] mb-6">Create a workspace to collaborate with your team.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {workspaces.map(ws => {
        const isExpanded = expandedId === ws.id;
        const detail = details[ws.id];
        const isLoading = loadingDetails[ws.id];

        return (
          <div key={ws.id} className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
            <button 
              onClick={() => toggleExpand(ws.id)}
              className="w-full flex items-center justify-between p-5 bg-white hover:bg-[#F9FAFB] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white font-bold">
                  {ws.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-[#1A1A1A]">{ws.name}</h3>
                  <p className="text-xs text-[#6B7280]">
                    {detail ? `Role: ${detail.role.charAt(0).toUpperCase() + detail.role.slice(1)}` : 'Loading...'}
                  </p>
                </div>
              </div>
              {isExpanded ? <ChevronDown className="w-5 h-5 text-[#9CA3AF]" /> : <ChevronRight className="w-5 h-5 text-[#9CA3AF]" />}
            </button>

            {isExpanded && (
              <div className="p-5 border-t border-[#E5E7EB] bg-[#F9FAFB]">
                {isLoading && !detail ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-[#9CA3AF]" /></div>
                ) : detail && (
                  <div className="space-y-6">
                    {/* Members Section */}
                    <div className="bg-white p-5 rounded-lg border border-[#E5E7EB]">
                      <h4 className="text-sm font-semibold text-[#1A1A1A] mb-4">MEMBERS ({detail.members.length})</h4>
                      
                      <div className="space-y-3 mb-6">
                        {detail.members.map((m: any) => (
                          <div key={m.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                                <User className="w-4 h-4 text-[#6B7280]" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#1A1A1A]">{m.name}</p>
                                <p className="text-xs text-[#6B7280]">{m.email}</p>
                              </div>
                            </div>
                            <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-600">
                              {m.role}
                            </span>
                          </div>
                        ))}
                      </div>

                      {(detail.role === 'owner' || detail.role === 'admin') && (
                        <>
                          <div className="pt-4 border-t border-[#E5E7EB]">
                            <p className="text-sm font-medium text-[#374151] mb-2">Invite by email:</p>
                            <div className="flex gap-2">
                              <input 
                                type="email" 
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                placeholder="colleague@company.com" 
                                className="flex-1 px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg"
                              />
                              <select 
                                value={inviteRole}
                                onChange={e => setInviteRole(e.target.value)}
                                className="px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-white"
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                              </select>
                              <button 
                                onClick={() => handleInvite(ws.id)}
                                disabled={inviting}
                                className="px-4 py-2 bg-[#F59E0B] text-white rounded-lg text-sm font-medium hover:bg-[#D97706] disabled:opacity-50"
                              >
                                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invite"}
                              </button>
                            </div>
                            {inviteMsg && <p className="text-xs text-[#6B7280] mt-2">{inviteMsg}</p>}
                          </div>

                          <div className="pt-4 mt-4 border-t border-[#E5E7EB]">
                            <p className="text-sm font-medium text-[#374151] mb-2">Invite Link:</p>
                            <button 
                              onClick={() => copyInviteLink(ws.id)}
                              className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#374151] hover:bg-gray-50"
                            >
                              <Copy className="w-4 h-4" /> Copy Invite Link
                            </button>
                          </div>
                        </>
                      )}
                      
                      {detail.invitations?.length > 0 && (
                        <div className="pt-4 mt-4 border-t border-[#E5E7EB]">
                          <p className="text-sm font-medium text-[#374151] mb-2">Pending Invitations:</p>
                          <div className="space-y-2">
                            {detail.invitations.map((inv: any) => (
                              <div key={inv.id} className="flex items-center justify-between text-sm">
                                <span className="text-[#6B7280]">{inv.invited_email}</span>
                                <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">Pending</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Contracts Section */}
                    <div className="bg-white p-5 rounded-lg border border-[#E5E7EB]">
                      <h4 className="text-sm font-semibold text-[#1A1A1A] mb-4">CONTRACTS IN THIS WORKSPACE ({detail.contracts.length})</h4>
                      
                      <div className="space-y-3">
                        {detail.contracts.length === 0 ? (
                          <p className="text-sm text-[#6B7280]">No contracts found in this workspace.</p>
                        ) : (
                          detail.contracts.map((c: any) => (
                            <div key={c.id} className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-[#1A1A1A]">{c.name}</p>
                                <p className="text-xs text-[#6B7280]">Uploaded by {c.uploaded_by} · {new Date(c.created_at).toLocaleDateString()}</p>
                              </div>
                              <button 
                                onClick={() => handleRemoveContract(c.id, ws.id)}
                                className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1.5 hover:bg-red-50 rounded transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Delete Workspace */}
                    {detail.role === 'owner' && (
                      <div className="flex justify-end pt-2">
                        <button 
                          onClick={() => handleDeleteWorkspace(ws.id)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" /> Delete Workspace
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {deleteModalId && details[deleteModalId] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2 mb-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Delete {details[deleteModalId].name}?
            </h3>
            <p className="text-sm text-[#6B7280] mb-4">
              This workspace has:
              <br />• {details[deleteModalId].members.length} members
              <br />• {details[deleteModalId].contracts.length} contracts
            </p>
            
            <div className="mb-6">
              <p className="text-sm font-medium text-[#1A1A1A] mb-2">What happens to the contracts?</p>
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer p-3 border border-[#E5E7EB] rounded-lg hover:bg-gray-50">
                  <input 
                    type="radio" 
                    name="deleteAction" 
                    checked={deleteOption === "move"} 
                    onChange={() => setDeleteOption("move")}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">Move to Personal Space</p>
                    <p className="text-xs text-[#6B7280]">Keep your contracts safe</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer p-3 border border-red-100 rounded-lg hover:bg-red-50">
                  <input 
                    type="radio" 
                    name="deleteAction" 
                    checked={deleteOption === "delete"} 
                    onChange={() => setDeleteOption("delete")}
                    className="mt-0.5 accent-red-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-red-700">Delete Permanently</p>
                    <p className="text-xs text-red-500">This action cannot be undone</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteModalId(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteWorkspace}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Workspace"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
