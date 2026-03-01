"use client";

import { useState } from "react";
import { 
  BarChart3, 
  FileText, 
  Sparkles, 
  Users,
  Zap,
  Calendar,
  TrendingUp,
  AlertCircle
} from "lucide-react";

interface UsageStats {
  plan: 'free' | 'solo' | 'pro' | 'business';
  contractLimit: number;
  contractUsed: number;
  analysisLimit: number;
  analysisUsed: number;
  memberLimit: number;
  memberUsed: number;
  billingCycle: string;
  resetDate: string;
}

const mockStats: UsageStats = {
  plan: 'pro',
  contractLimit: Infinity,
  contractUsed: 12,
  analysisLimit: 100,
  analysisUsed: 34,
  memberLimit: 3,
  memberUsed: 2,
  billingCycle: 'Monthly',
  resetDate: '2026-04-01'
};

const planDetails = {
  free: { name: 'Free', price: '$0', features: ['3 contracts', '3 AI analyses', '1 workspace'] },
  solo: { name: 'Solo', price: '$9.9/mo', features: ['50 contracts', '30 AI analyses/month', '1 workspace'] },
  pro: { name: 'Pro', price: '$29/mo', features: ['Unlimited contracts', '100 AI analyses/month', '5 workspaces'] },
  business: { name: 'Business', price: '$69/mo', features: ['Unlimited contracts', '500 AI analyses/month', 'Unlimited workspaces'] }
};

export default function UsageStatsPanel() {
  const [stats] = useState(mockStats);
  const planInfo = planDetails[stats.plan];

  const getPercentage = (used: number, limit: number) => {
    if (limit === Infinity) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

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
            <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
              <Zap className="w-4 h-4 text-[#F59E0B]" />
              {feature}
            </div>
          ))}
        </div>

        <button className="w-full py-2.5 bg-[#F59E0B] text-white rounded-lg font-medium hover:bg-[#D97706] transition-colors">
          Upgrade Plan
        </button>
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
                {stats.contractUsed} / {stats.contractLimit === Infinity ? '∞' : stats.contractLimit}
              </span>
            </div>
            <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div 
                className={`h-full ${stats.contractLimit === Infinity ? 'bg-green-500 w-1' : getProgressColor(getPercentage(stats.contractUsed, stats.contractLimit))}`}
                style={{ 
                  width: stats.contractLimit === Infinity ? '5%' : `${getPercentage(stats.contractUsed, stats.contractLimit)}%` 
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
                style={{ width: `${getPercentage(stats.analysisUsed, stats.analysisLimit)}%` }}
              />
            </div>
            {getPercentage(stats.analysisUsed, stats.analysisLimit) > 80 && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                You're approaching your monthly limit
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
                style={{ width: `${getPercentage(stats.memberUsed, stats.memberLimit)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <Calendar className="w-4 h-4" />
            <span>Resets on {new Date(stats.resetDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-[#6B7280] uppercase tracking-wide">This Month</span>
          </div>
          <p className="text-2xl font-bold text-[#1A1A1A]">+3</p>
          <p className="text-sm text-[#6B7280]">New contracts</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-xs text-[#6B7280] uppercase tracking-wide">Avg Risk Score</span>
          </div>
          <p className="text-2xl font-bold text-[#1A1A1A]">47</p>
          <p className="text-sm text-[#6B7280]">Medium risk</p>
        </div>
      </div>
    </div>
  );
}
