"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  FileText,
  Sparkles,
  Users,
  Zap,
  Calendar,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { supabaseClient } from "@/lib/supabase";

interface UsageStats {
  plan: "free" | "solo" | "pro" | "business";
  contractLimit: number | null;
  contractUsed: number;
  analysisLimit: number;
  analysisUsed: number;
  memberLimit: number;
  memberUsed: number;
  billingCycle: string;
  resetDate: string;
}

const PLAN_DETAILS: Record<string, {
  name: string;
  price: string;
  contractLimit: number | null;
  analysisLimit: number;
  memberLimit: number;
  features: string[];
}> = {
  free: {
    name: "Free",
    price: "$0",
    contractLimit: 3,
    analysisLimit: 3,
    memberLimit: 1,
    features: ["3 contracts", "3 AI analyses", "1 workspace"],
  },
  solo: {
    name: "Solo",
    price: "$9.9/mo",
    contractLimit: 50,
    analysisLimit: 30,
    memberLimit: 1,
    features: ["50 contracts", "30 AI analyses/month", "1 workspace"],
  },
  pro: {
    name: "Pro",
    price: "$29/mo",
    contractLimit: null,
    analysisLimit: 100,
    memberLimit: 3,
    features: ["Unlimited contracts", "100 AI analyses/month", "5 workspaces"],
  },
  business: {
    name: "Business",
    price: "$69/mo",
    contractLimit: null,
    analysisLimit: 500,
    memberLimit: 10,
    features: ["Unlimited contracts", "500 AI analyses/month", "Unlimited workspaces"],
  },
};

export default function UsageStatsPanel() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      // Get profile
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("plan, analyses_used, analyses_reset_date")
        .eq("id", user.id)
        .single();

      const rawPlan = profile?.plan || "free";
      const plan = (Object.keys(PLAN_DETAILS).includes(rawPlan) ? rawPlan : "free") as "free" | "solo" | "pro" | "business";
      const planInfo = PLAN_DETAILS[plan] || PLAN_DETAILS.free;

      // Get contract count
      const { count: contractCount } = await supabaseClient
        .from("contracts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Get contracts with analyses this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: analysisCount } = await supabaseClient
        .from("contracts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("analysis_result", "is", null)
        .gte("updated_at", startOfMonth.toISOString());

      // Calculate reset date (first day of next month)
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);

      setStats({
        plan,
        contractLimit: planInfo.contractLimit,
        contractUsed: contractCount || 0,
        analysisLimit: planInfo.analysisLimit,
        analysisUsed: profile?.analyses_used || analysisCount || 0,
        memberLimit: planInfo.memberLimit,
        memberUsed: 1, // Just the user themselves for now
        billingCycle: "Monthly",
        resetDate: nextMonth.toISOString().split("T")[0],
      });
    } catch (err) {
      console.error("Failed to load usage stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (used: number, limit: number | null) => {
    if (!limit) return 5; // unlimited — show tiny bar
    return Math.min((used / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return "bg-green-500";
    if (percentage < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#F59E0B]" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 text-center text-[#6B7280]">
        Could not load usage data. Please try again.
      </div>
    );
  }

  const planInfo = PLAN_DETAILS[stats.plan] || PLAN_DETAILS.free;

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#333] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Current Plan</p>
            <h3 className="text-2xl font-bold">{planInfo.name}</h3>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{planInfo.price}</p>
            <p className="text-sm text-gray-400">{stats.billingCycle}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {planInfo.features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm text-gray-300"
            >
              <Zap className="w-4 h-4 text-[#F59E0B]" />
              {feature}
            </div>
          ))}
        </div>

        {stats.plan !== "business" && (
          <button className="w-full py-2.5 bg-[#F59E0B] text-white rounded-lg font-medium hover:bg-[#D97706] transition-colors">
            Upgrade Plan
          </button>
        )}
      </div>

      {/* Usage Stats */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h3 className="font-semibold text-[#1A1A1A] mb-6">Usage This Period</h3>

        <div className="space-y-6">
          {/* Contracts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#6B7280]" />
                <span className="text-sm text-[#374151]">Contracts</span>
              </div>
              <span className="text-sm font-medium text-[#1A1A1A]">
                {stats.contractUsed} /{" "}
                {stats.contractLimit === null ? "∞" : stats.contractLimit}
              </span>
            </div>
            <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(getPercentage(stats.contractUsed, stats.contractLimit))}`}
                style={{
                  width: `${getPercentage(stats.contractUsed, stats.contractLimit)}%`,
                }}
              />
            </div>
          </div>

          {/* AI Analyses */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#6B7280]" />
                <span className="text-sm text-[#374151]">AI Analyses</span>
              </div>
              <span className="text-sm font-medium text-[#1A1A1A]">
                {stats.analysisUsed} / {stats.analysisLimit}
              </span>
            </div>
            <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(getPercentage(stats.analysisUsed, stats.analysisLimit))}`}
                style={{
                  width: `${getPercentage(stats.analysisUsed, stats.analysisLimit)}%`,
                }}
              />
            </div>
            {getPercentage(stats.analysisUsed, stats.analysisLimit) > 80 && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                You are approaching your monthly limit
              </p>
            )}
          </div>

          {/* Team Members */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#6B7280]" />
                <span className="text-sm text-[#374151]">Team Members</span>
              </div>
              <span className="text-sm font-medium text-[#1A1A1A]">
                {stats.memberUsed} / {stats.memberLimit}
              </span>
            </div>
            <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(getPercentage(stats.memberUsed, stats.memberLimit))}`}
                style={{
                  width: `${getPercentage(stats.memberUsed, stats.memberLimit)}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <Calendar className="w-4 h-4" />
            <span>
              Resets on{" "}
              {new Date(stats.resetDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-[#6B7280] uppercase tracking-wide">
              Contracts
            </span>
          </div>
          <p className="text-2xl font-bold text-[#1A1A1A]">
            {stats.contractUsed}
          </p>
          <p className="text-sm text-[#6B7280]">Total stored</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-xs text-[#6B7280] uppercase tracking-wide">
              AI Analyses
            </span>
          </div>
          <p className="text-2xl font-bold text-[#1A1A1A]">
            {stats.analysisUsed}
          </p>
          <p className="text-sm text-[#6B7280]">Used this month</p>
        </div>
      </div>
    </div>
  );
}
