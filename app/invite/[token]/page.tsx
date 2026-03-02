"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invite, setInvite] = useState<any>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) return;

    const checkInvite = async () => {
      try {
        const res = await fetch(`/api/invites/${token}`);
        if (res.status === 401) {
          // Store token in session storage to redirect back after login
          sessionStorage.setItem("pending_invite", token);
          router.push(`/login?redirect=/invite/${token}`);
          return;
        }
        
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load invitation");
        }
        
        setInvite(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    checkInvite();
  }, [token, router]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await fetch(`/api/invites/${token}/accept`, { method: "POST" });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      // Navigate to workspace
      localStorage.setItem("activeWorkspaceId", data.workspace_id);
      window.dispatchEvent(new Event('workspaceChange'));
      router.push(`/contracts`);
      
    } catch (e: any) {
      setError(e.message || "Failed to accept invitation");
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#F59E0B]" />
        <p className="mt-4 text-[#6B7280]">Loading invitation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-sm max-w-md w-full text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-2">Invalid Invitation</h2>
          <p className="text-[#6B7280] mb-6">{error}</p>
          <Button onClick={() => router.push("/contracts")} className="w-full bg-[#1A1A1A] hover:bg-[#333]">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-sm max-w-md w-full">
        <div className="w-16 h-16 bg-[#FEF3C7] rounded-full flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-8 h-8 text-[#D97706]" />
        </div>
        
        <h2 className="text-2xl font-semibold text-center text-[#1A1A1A] mb-2">
          You've been invited!
        </h2>
        
        <p className="text-center text-[#6B7280] mb-8">
          You have been invited to join <span className="font-medium text-[#1A1A1A]">{invite.workspace_name}</span>.
        </p>

        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 mb-8">
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[#E5E7EB]">
            <div className="w-8 h-8 rounded-full bg-[#E5E7EB] flex items-center justify-center">
              <User className="w-4 h-4 text-[#6B7280]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">Invited by</p>
              <p className="text-xs text-[#6B7280]">{invite.inviter_name || invite.inviter_email}</p>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#6B7280]">Role</span>
            <span className="font-medium text-[#1A1A1A] capitalize">{invite.role}</span>
          </div>
        </div>

        <Button 
          onClick={handleAccept} 
          disabled={accepting}
          className="w-full py-6 text-base bg-[#F59E0B] hover:bg-[#D97706] text-white"
        >
          {accepting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Accepting...
            </>
          ) : (
            "Accept Invitation"
          )}
        </Button>
        
        <div className="mt-4 text-center">
          <button 
            onClick={() => router.push("/contracts")}
            className="text-sm text-[#6B7280] hover:text-[#1A1A1A]"
          >
            Decline & Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
