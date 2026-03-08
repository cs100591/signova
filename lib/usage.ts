import { createClient } from '@supabase/supabase-js';
import { PLANS, PlanKey } from './plans';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getUserUsage(userId: string) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan, analyses_used, analyses_reset_date, comparisons_used, comparisons_reset_date')
    .eq('id', userId)
    .single();

  const plan = (profile?.plan || 'free') as PlanKey;
  const limits = PLANS[plan];
  const analysesUsed = profile?.analyses_used || 0;
  const comparisonsUsed = profile?.comparisons_used || 0;

  // Count contracts
  const { count: contractCount } = await supabaseAdmin
    .from('contracts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  return {
    plan,
    limits,
    analysesUsed,
    analysesLimit: limits.analyses,
    comparisonsUsed,
    comparisonsLimit: limits.comparisons,
    contractCount: contractCount || 0,
    contractLimit: limits.contracts,
  };
}

export async function canUploadContract(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const usage = await getUserUsage(userId);
  if (usage.contractLimit === Infinity) return { allowed: true };
  if (usage.contractCount >= usage.contractLimit) {
    return {
      allowed: false,
      reason: `You've reached your ${usage.contractLimit} contract limit on the ${PLANS[usage.plan].name} plan.`,
    };
  }
  return { allowed: true };
}

export async function canAnalyzeContract(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const usage = await getUserUsage(userId);
  if (usage.analysesUsed >= usage.analysesLimit) {
    return {
      allowed: false,
      reason: `You've used all ${usage.analysesLimit} analyses on the ${PLANS[usage.plan].name} plan.`,
    };
  }
  return { allowed: true };
}

/**
 * Check if user can perform a contract comparison.
 * All plans get monthly quota with reset.
 */
export async function canCompareContract(userId: string): Promise<{ allowed: boolean; reason?: string; comparisonsUsed: number; comparisonsLimit: number }> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan, comparisons_used, comparisons_reset_date')
    .eq('id', userId)
    .single();

  const plan = (profile?.plan || 'free') as PlanKey;
  const limits = PLANS[plan];
  let comparisonsUsed = profile?.comparisons_used || 0;

  // Check if monthly reset is needed (all plans reset monthly)
  const now = new Date();
  const resetDate = profile?.comparisons_reset_date ? new Date(profile.comparisons_reset_date) : null;
  if (!resetDate || now > resetDate) {
    comparisonsUsed = 0;
    const nextReset = new Date(now);
    nextReset.setMonth(nextReset.getMonth() + 1);
    await supabaseAdmin
      .from('profiles')
      .update({ comparisons_used: 0, comparisons_reset_date: nextReset.toISOString() })
      .eq('id', userId);
  }

  if (comparisonsUsed >= limits.comparisons) {
    return {
      allowed: false,
      reason: `You've used all ${limits.comparisons} monthly comparison${limits.comparisons !== 1 ? 's' : ''} on the ${limits.name} plan.`,
      comparisonsUsed,
      comparisonsLimit: limits.comparisons,
    };
  }

  return { allowed: true, comparisonsUsed, comparisonsLimit: limits.comparisons };
}

/**
 * Increment comparison usage counter.
 * All plans use monthly reset logic.
 */
export async function incrementComparisonUsage(userId: string) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('comparisons_used, comparisons_reset_date')
    .eq('id', userId)
    .single();

  const now = new Date();
  const resetDate = profile?.comparisons_reset_date ? new Date(profile.comparisons_reset_date) : null;

  if (!resetDate || now > resetDate) {
    // Start new billing cycle
    const nextReset = new Date(now);
    nextReset.setMonth(nextReset.getMonth() + 1);
    await supabaseAdmin
      .from('profiles')
      .update({ comparisons_used: 1, comparisons_reset_date: nextReset.toISOString() })
      .eq('id', userId);
  } else {
    await supabaseAdmin
      .from('profiles')
      .update({ comparisons_used: (profile?.comparisons_used || 0) + 1 })
      .eq('id', userId);
  }
}

export async function incrementAnalysisUsage(userId: string) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('analyses_used, analyses_reset_date, plan')
    .eq('id', userId)
    .single();

  const now = new Date();
  const resetDate = profile?.analyses_reset_date ? new Date(profile.analyses_reset_date) : null;

  // Reset monthly counter if needed
  if (!resetDate || now > resetDate) {
    const nextReset = new Date(now);
    nextReset.setMonth(nextReset.getMonth() + 1);
    await supabaseAdmin
      .from('profiles')
      .update({ analyses_used: 1, analyses_reset_date: nextReset.toISOString() })
      .eq('id', userId);
  } else {
    await supabaseAdmin
      .from('profiles')
      .update({ analyses_used: (profile?.analyses_used || 0) + 1 })
      .eq('id', userId);
  }
}
