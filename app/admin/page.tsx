'use client';

import { useEffect, useState, useCallback } from 'react';

interface Stats {
  users: { total: number; today: number; week: number; month: number };
  contracts: { total: number; today: number };
  analyses: { total: number };
  comparisons: { total: number };
  recentUsers: { id: string; email: string; created_at: string; full_name: string | null }[];
  planCounts: Record<string, number>;
  generatedAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-amber-400 text-lg animate-pulse">Loading dashboard...</div>
    </div>
  );

  if (!stats) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-red-400">Failed to load stats.</div>
    </div>
  );

  const StatCard = ({ label, value, sub }: { label: string; value: number | string; sub?: string }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-1">
      <div className="text-gray-400 text-sm">{label}</div>
      <div className="text-white text-3xl font-bold">{value}</div>
      {sub && <div className="text-gray-500 text-xs">{sub}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">👑 Signova Admin</h1>
          <p className="text-gray-500 text-sm mt-1">
            Live dashboard · Auto-refresh every 30s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-gray-400 text-sm">
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString('en-MY')}` : 'Loading...'}
          </span>
          <button
            onClick={fetchStats}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-3 py-1.5 rounded-lg transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Users Section */}
      <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-3">Users</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={stats.users.total ?? 0} />
        <StatCard label="Today" value={stats.users.today ?? 0} sub="new signups" />
        <StatCard label="This Week" value={stats.users.week ?? 0} sub="new signups" />
        <StatCard label="This Month" value={stats.users.month ?? 0} sub="new signups" />
      </div>

      {/* Usage Section */}
      <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-3">Usage</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Contracts" value={stats.contracts.total ?? 0} />
        <StatCard label="Contracts Today" value={stats.contracts.today ?? 0} sub="uploaded" />
        <StatCard label="AI Analyses" value={stats.analyses.total ?? 0} sub="all time" />
        <StatCard label="Comparisons" value={stats.comparisons.total ?? 0} sub="all time" />
      </div>

      {/* Plan Breakdown */}
      {stats.planCounts && Object.keys(stats.planCounts).length > 0 && (
        <>
          <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-3">Subscriptions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Object.entries(stats.planCounts).map(([key, count]) => (
              <StatCard key={key} label={key.replace('_', ' · ')} value={count} />
            ))}
          </div>
        </>
      )}

      {/* Recent Signups */}
      <h2 className="text-gray-400 text-xs uppercase tracking-widest mb-3">Recent Signups</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase">
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Signed Up</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentUsers?.map((u, i) => (
              <tr key={u.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition ${i === 0 ? 'bg-amber-950/20' : ''}`}>
                <td className="px-4 py-3 text-gray-200">{u.email}</td>
                <td className="px-4 py-3 text-gray-400">{u.full_name || '—'}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(u.created_at).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'short', timeStyle: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-gray-700 text-xs text-center mt-6">
        signova.me/admin · {new Date(stats.generatedAt).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}
      </p>
    </div>
  );
}
