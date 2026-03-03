import { createClient } from '@supabase/supabase-js';
import { PLANS, PlanKey } from './plans';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getUserUsage(userId: string) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('plan, analyses_used, analyses_reset_date')
    .eq('id', userId)
    .single();

  const plan = (profile?.plan || 'free') as PlanKey;
  const limits = PLANS[plan];
  const analysesUsed = profile?.analyses_used || 0;

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
