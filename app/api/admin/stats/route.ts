import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Total users
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // New users today
    const { count: todayUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    // New users this week
    const { count: weekUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisWeek);

    // New users this month
    const { count: monthUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisMonth);

    // Total contracts
    const { count: totalContracts } = await supabaseAdmin
      .from('contracts')
      .select('*', { count: 'exact', head: true });

    // Contracts today
    const { count: todayContracts } = await supabaseAdmin
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    // Total analyses
    const { count: totalAnalyses } = await supabaseAdmin
      .from('contract_analyses')
      .select('*', { count: 'exact', head: true });

    // Total comparisons
    const { count: totalComparisons } = await supabaseAdmin
      .from('contract_comparisons')
      .select('*', { count: 'exact', head: true });

    // Recent signups (last 10)
    const { data: recentUsers } = await supabaseAdmin
      .from('profiles')
      .select('id, email, created_at, full_name')
      .order('created_at', { ascending: false })
      .limit(10);

    // Subscriptions breakdown
    const { data: subs } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status');

    const planCounts: Record<string, number> = {};
    subs?.forEach((s) => {
      const key = `${s.plan}_${s.status}`;
      planCounts[key] = (planCounts[key] || 0) + 1;
    });

    return NextResponse.json({
      users: { total: totalUsers, today: todayUsers, week: weekUsers, month: monthUsers },
      contracts: { total: totalContracts, today: todayContracts },
      analyses: { total: totalAnalyses },
      comparisons: { total: totalComparisons },
      recentUsers,
      planCounts,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Admin Stats]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
