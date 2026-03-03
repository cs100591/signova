"use client";

import { useState, useEffect } from "react";
import {
  User,
  Bell,
  CreditCard,
  Shield,
  Users,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Check,
  Mail,
} from "lucide-react";
import WorkspaceManagement from "@/components/settings/workspace-management";
import SubscriptionManager from "@/components/settings/subscription-manager";
import { supabaseClient } from "@/lib/supabase";

const settingsTabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing & Usage", icon: CreditCard },
  { id: "team", label: "Workspace Management", icon: Users },
  { id: "security", label: "Security", icon: Shield },
];

interface Profile {
  full_name: string;
  email: string;
  country: string;
  preferred_language: string;
  plan: string;
  company_size: string;
  contract_types: string[];
  analysis_style: string;
}

interface TeamMember {
  user_id: string;
  email: string;
  role: string;
}

const JURISDICTIONS = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Malaysia",
  "Singapore",
  "India",
  "Germany",
  "France",
  "Philippines",
  "Indonesia",
  "Other",
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("billing");
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    email: "",
    country: "",
    preferred_language: "EN",
    plan: "free",
    company_size: "",
    contract_types: [],
    analysis_style: "balanced",
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabaseClient
        .from("profiles")
        .select("full_name, country, preferred_language, plan, company_size, contract_types, analysis_style")
        .eq("id", user.id)
        .single();

      setProfile({
        full_name: profileData?.full_name || "",
        email: user.email || "",
        country: profileData?.country || "",
        preferred_language: profileData?.preferred_language || "EN",
        plan: profileData?.plan || "free",
        company_size: profileData?.company_size || "",
        contract_types: profileData?.contract_types || [],
        analysis_style: profileData?.analysis_style || "balanced",
      });

      // Load team members (workspace_members for active workspace)
      setTeamMembers([
        {
          user_id: user.id,
          email: user.email || "",
          role: "Owner",
        },
      ]);
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      const { error } = await supabaseClient
        .from("profiles")
        .update({
          full_name: profile.full_name,
          country: profile.country,
          preferred_language: profile.preferred_language,
          company_size: profile.company_size || null,
          contract_types: profile.contract_types,
          analysis_style: profile.analysis_style,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      setInviteError("Please enter a valid email address.");
      return;
    }

    setInviting(true);
    setInviteError("");
    setInviteSuccess("");

    try {
      // For now, we store the invite intent — email sending would require Resend setup
      // Check plan limits
      const canInvite = profile.plan === "pro" || profile.plan === "business";
      if (!canInvite) {
        setInviteError("Team members require a Pro or Business plan. Please upgrade.");
        return;
      }

      // Simulate invite (in production, this calls /api/invites endpoint)
      await new Promise((r) => setTimeout(r, 800));
      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
    } catch (err) {
      setInviteError("Failed to send invite. Please try again.");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] p-8">
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[32px] font-semibold text-[#1A1A1A] mb-1">Settings</h1>
          <p className="text-[15px] text-[#6B7280]">
            Manage your account, workspace, and billing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-[#FEF3C7] text-[#B45309]"
                        : "hover:bg-[#F9FAFB] text-[#374151]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 ${
                        activeTab === tab.id ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-2">
            {activeTab === "billing" && <SubscriptionManager />}

            {activeTab === "profile" && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                <h3 className="font-semibold text-[#1A1A1A] mb-6">
                  Profile Information
                </h3>

                {profileLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-[#F59E0B]" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#6B7280] mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profile.full_name}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            full_name: e.target.value,
                          }))
                        }
                        placeholder="Your full name"
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#F59E0B]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-[#6B7280] mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB] text-[#6B7280] cursor-not-allowed"
                      />
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        Email cannot be changed here. Contact support if needed.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm text-[#6B7280] mb-1">
                        Primary Jurisdiction
                      </label>
                      <select
                        value={profile.country}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            country: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#F59E0B]"
                      >
                        <option value="">Select jurisdiction...</option>
                        {JURISDICTIONS.map((j) => (
                          <option key={j} value={j}>
                            {j}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-[#6B7280] mb-1">
                        Preferred Language
                      </label>
                      <select
                        value={profile.preferred_language}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            preferred_language: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#F59E0B]"
                      >
                        <option value="EN">English</option>
                        <option value="ZH_CN">中文 (简体)</option>
                        <option value="ZH_TW">中文 (繁體)</option>
                        <option value="MS">Bahasa Malaysia</option>
                      </select>
                    </div>

                    {/* AI Preferences */}
                    <div className="pt-4 border-t border-[#F3F4F6]">
                      <h4 className="text-sm font-semibold text-[#1A1A1A] mb-4">AI Preferences</h4>

                      <div className="space-y-4">
                        {/* Company size */}
                        <div>
                          <label className="block text-sm text-[#6B7280] mb-1">I am a...</label>
                          <select
                            value={profile.company_size}
                            onChange={(e) => setProfile(p => ({ ...p, company_size: e.target.value }))}
                            className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#F59E0B]"
                          >
                            <option value="">Select...</option>
                            <option value="individual">Individual / Freelancer</option>
                            <option value="small_business">Small Business (&lt;10 people)</option>
                            <option value="sme">SME (10–100 people)</option>
                            <option value="enterprise">Enterprise (100+ people)</option>
                          </select>
                        </div>

                        {/* Contract types */}
                        <div>
                          <label className="block text-sm text-[#6B7280] mb-2">Contract types I deal with</label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: "employment", label: "Employment" },
                              { id: "freelance", label: "Freelance / Contractor" },
                              { id: "nda", label: "NDA / Confidentiality" },
                              { id: "lease", label: "Lease / Rental" },
                              { id: "saas", label: "SaaS / Software" },
                              { id: "business", label: "Business / Vendor" },
                              { id: "other", label: "Other" },
                            ].map((type) => {
                              const checked = profile.contract_types.includes(type.id);
                              return (
                                <button
                                  key={type.id}
                                  type="button"
                                  onClick={() =>
                                    setProfile(p => ({
                                      ...p,
                                      contract_types: checked
                                        ? p.contract_types.filter(t => t !== type.id)
                                        : [...p.contract_types, type.id],
                                    }))
                                  }
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                                    checked
                                      ? "bg-[#FEF3C7] border-[#F59E0B] text-[#B45309]"
                                      : "bg-white border-[#E5E7EB] text-[#374151] hover:border-[#F59E0B]"
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                                    checked ? "bg-[#F59E0B] border-[#F59E0B]" : "border-[#D1D5DB]"
                                  }`}>
                                    {checked && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  {type.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Analysis style */}
                        <div>
                          <label className="block text-sm text-[#6B7280] mb-2">Analysis style</label>
                          <select
                            value={profile.analysis_style}
                            onChange={(e) => setProfile(p => ({ ...p, analysis_style: e.target.value }))}
                            className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#F59E0B]"
                          >
                            <option value="flag_everything">Flag everything — every risk, even minor</option>
                            <option value="balanced">Balanced — important risks only (default)</option>
                            <option value="dealbreakers_only">Deal-breakers only — serious issues only</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={profileSaving}
                        className="px-6 py-2.5 bg-[#1A1A1A] text-white rounded-lg font-medium hover:bg-[#333] disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        {profileSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </button>

                      {profileSaved && (
                        <span className="flex items-center gap-1.5 text-sm text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          Saved!
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                <h3 className="font-semibold text-[#1A1A1A] mb-6">
                  Email Notifications
                </h3>

                <div className="space-y-4">
                  {[
                    {
                      label: "Contract expiry reminders",
                      desc: "90, 30, 7 days before expiry",
                      checked: true,
                    },
                    {
                      label: "New team member invitations",
                      desc: "When someone invites you to a workspace",
                      checked: true,
                    },
                    {
                      label: "Weekly digest",
                      desc: "Summary of your contracts and usage",
                      checked: false,
                    },
                    {
                      label: "Product updates",
                      desc: "New features and improvements",
                      checked: true,
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 border-b border-[#F3F4F6] last:border-0"
                    >
                      <div>
                        <p className="font-medium text-[#374151]">
                          {item.label}
                        </p>
                        <p className="text-sm text-[#6B7280]">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={item.checked}
                        className="w-5 h-5 accent-[#F59E0B]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "team" && (
              <div className="bg-[#F8F7F4] rounded-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-[#1A1A1A]">Workspace Management</h3>
                    <p className="text-sm text-[#6B7280] mt-1">Manage your workspaces, members, and permissions.</p>
                  </div>
                </div>
                <WorkspaceManagement />
              </div>
            )}

            {activeTab === "security" && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                <h3 className="font-semibold text-[#1A1A1A] mb-6">
                  Security Settings
                </h3>

                <div className="space-y-6">
                  <div>
                    <p className="font-medium text-[#374151] mb-1">
                      Change Password
                    </p>
                    <p className="text-sm text-[#6B7280] mb-3">
                      A password reset link will be sent to {profile.email}
                    </p>
                    <button
                      onClick={async () => {
                        if (!profile.email) return;
                        await supabaseClient.auth.resetPasswordForEmail(
                          profile.email,
                          { redirectTo: `${window.location.origin}/auth/callback` }
                        );
                        alert("Password reset email sent!");
                      }}
                      className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#374151] hover:bg-[#F9FAFB]"
                    >
                      Send Reset Email
                    </button>
                  </div>

                  <hr className="border-[#E5E7EB]" />

                  <div>
                    <p className="font-medium text-red-600 mb-2">Danger Zone</p>
                    <p className="text-sm text-[#6B7280] mb-3">
                      Deleting your account is permanent and cannot be undone.
                    </p>
                    <button className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
