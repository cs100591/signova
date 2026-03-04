"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Zap, Star, Building2, Sparkles } from "lucide-react";
import { supabaseClient } from "@/lib/supabase";
import { PLANS, PlanKey } from "@/lib/plans";

interface Subscription {
  plan: PlanKey;
  status: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

interface UsageData {
  plan: PlanKey;
  analysesUsed: number;
  analysesLimit: number;
  contractCount: number;
  contractLimit: number;
}

const PLAN_ICONS: Record<PlanKey, React.ReactNode> = {
  free: <Sparkles className="w-5 h-5" />,
  solo: <Zap className="w-5 h-5" />,
  pro: <Star className="w-5 h-5" />,
  business: <Building2 className="w-5 h-5" />,
};

const PLAN_COLORS: Record<PlanKey, string> = {
  free: "bg-gray-100 text-gray-600",
  solo: "bg-blue-100 text-blue-700",
  pro: "bg-amber-100 text-amber-700",
  business: "bg-purple-100 text-purple-700",
};

export default function SubscriptionManager() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [managingBilling, setManagingBilling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      const [{ data: sub }, { data: profile }, { count: contractCount }] = await Promise.all([
        supabaseClient.from("subscriptions").select("*").eq("user_id", user.id).single(),
        supabaseClient.from("profiles").select("plan, analyses_used, analyses_reset_date").eq("id", user.id).single(),
        supabaseClient.from("contracts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      const plan = (profile?.plan || "free") as PlanKey;
      const limits = PLANS[plan];

      setSubscription(sub || { plan, status: "active" });
      setUsage({
        plan,
        analysesUsed: profile?.analyses_used || 0,
        analysesLimit: limits.analyses,
        contractCount: contractCount || 0,
        contractLimit: limits.contracts,
      });
    } catch (err) {
      console.error("Failed to load subscription:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    setUpgrading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          successUrl: `${window.location.origin}/settings?tab=billing&success=1`,
          cancelUrl: `${window.location.origin}/settings?tab=billing`,
        }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate checkout");
      }
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Upgrade failed:", err);
      alert(err.message || "An error occurred while upgrading.");
    } finally {
      setUpgrading(null);
    }
  };

  const handleManageBilling = async () => {
    setManagingBilling(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to open billing portal");
      }
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (err: any) {
      console.error("Portal failed:", err);
      alert(err.message || "An error occurred while opening the billing portal.");
    } finally {
      setManagingBilling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-[#F59E0B]" />
      </div>
    );
  }

  const currentPlan = usage?.plan || "free";
  const paidPlans = ["solo", "pro", "business"] as PlanKey[];

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h3 className="font-semibold text-[#1A1A1A] mb-4">Current Plan</h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${PLAN_COLORS[currentPlan]}`}>
              {PLAN_ICONS[currentPlan]}
            </div>
            <div>
              <p className="font-semibold text-[#1A1A1A]">
                {PLANS[currentPlan].name} Plan
                {PLANS[currentPlan].price > 0 && (
                  <span className="ml-2 text-sm font-normal text-[#6B7280]">
                    ${PLANS[currentPlan].price}/mo
                  </span>
                )}
              </p>
              {subscription?.status && (
                <p className="text-sm text-[#6B7280] capitalize">
                  Status: <span className={subscription.status === "active" ? "text-green-600" : "text-amber-600"}>{subscription.status}</span>
                </p>
              )}
              {subscription?.current_period_end && (
                <p className="text-sm text-[#6B7280]">
                  Renews: {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {currentPlan !== "free" && (
            <button
              onClick={handleManageBilling}
              disabled={managingBilling}
              className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#374151] hover:bg-[#F9FAFB] disabled:opacity-50 flex items-center gap-2"
            >
              {managingBilling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Manage Billing
            </button>
          )}
        </div>
      </div>

      {/* Usage */}
      {usage && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <h3 className="font-semibold text-[#1A1A1A] mb-4">Usage This Month</h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#6B7280]">AI Analyses</span>
                <span className="font-medium text-[#1A1A1A]">
                  {usage.analysesUsed} / {usage.analysesLimit === Infinity ? "∞" : usage.analysesLimit}
                </span>
              </div>
              {usage.analysesLimit !== Infinity && (
                <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F59E0B] rounded-full transition-all"
                    style={{ width: `${Math.min((usage.analysesUsed / usage.analysesLimit) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#6B7280]">Contracts Stored</span>
                <span className="font-medium text-[#1A1A1A]">
                  {usage.contractCount} / {usage.contractLimit === Infinity ? "∞" : usage.contractLimit}
                </span>
              </div>
              {usage.contractLimit !== Infinity && (
                <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F59E0B] rounded-full transition-all"
                    style={{ width: `${Math.min((usage.contractCount / usage.contractLimit) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Plans */}
      {currentPlan !== "business" && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <h3 className="font-semibold text-[#1A1A1A] mb-4">Upgrade Plan</h3>

          <div className="grid gap-3">
            {paidPlans
              .filter((p) => {
                const order = { free: 0, solo: 1, pro: 2, business: 3 };
                return order[p] > order[currentPlan];
              })
              .map((plan) => {
                const details = PLANS[plan];
                return (
                  <div
                    key={plan}
                    className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-xl hover:border-[#F59E0B] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${PLAN_COLORS[plan]}`}>
                        {PLAN_ICONS[plan]}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1A1A1A]">{details.name}</p>
                        <p className="text-sm text-[#6B7280]">
                          {details.contracts === Infinity ? "Unlimited" : details.contracts} contracts ·{" "}
                          {details.analyses} analyses/mo · {details.seats} seat{details.seats > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-[#1A1A1A]">${details.price}/mo</span>
                      <button
                        onClick={() => handleUpgrade(plan)}
                        disabled={!!upgrading}
                        className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#333] disabled:opacity-50 flex items-center gap-2"
                      >
                        {upgrading === plan ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Upgrade
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
