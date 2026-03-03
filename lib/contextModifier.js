/**
 * Layer 3 — Context Modifier
 * Adjusts risk score based on user profile.
 * Makes Signova a Decision Engine, not just an analysis tool.
 *
 * User profile fields used:
 *   region, jurisdiction, annual_revenue_range (optional),
 *   risk_tolerance (optional), company_size (optional)
 */

const revenueMap = {
  '< RM500K': 500000,
  'RM500K-2M': 2000000,
  'RM2M-10M': 10000000,
  '> RM10M': null
}

const getRiskLevel = (score) => {
  if (score <= 39) return 'SAFE'
  if (score <= 69) return 'NEGOTIATE'
  return 'HIGH RISK'
}

export const applyContextModifier = (riskResult, extracted, userProfile) => {
  let { riskScore, breakdown } = riskResult
  const modifiers = []

  // ── LIABILITY vs REVENUE ───────────────────
  const revenue = revenueMap[userProfile?.annual_revenue_range]
  const liabilityCap = extracted.liability_cap?.cap_amount

  if (revenue && liabilityCap) {
    const ratio = liabilityCap / revenue
    if (ratio > 0.1) {
      modifiers.push({
        modifier: 'high_liability_to_revenue_ratio',
        adjustment: 'force_high_risk',
        message: `Liability exposure exceeds 10% of your annual revenue`
      })
      riskScore = Math.max(riskScore, 70)
    }
  }

  // ── JURISDICTION MISMATCH ──────────────────
  const contractJurisdiction = extracted.governing_law?.country
  const userRegion = userProfile?.region

  if (
    contractJurisdiction &&
    userRegion &&
    contractJurisdiction.toLowerCase() !== userRegion.toLowerCase()
  ) {
    modifiers.push({
      modifier: 'jurisdiction_mismatch',
      adjustment: +10,
      message: `Contract uses ${contractJurisdiction} law but you are based in ${userRegion}. Cross-border enforcement may be difficult.`
    })
    riskScore = Math.min(riskScore + 10, 100)
  }

  // ── NON COMPETE ENFORCEABILITY ─────────────
  if (
    extracted.non_compete?.exists &&
    userProfile?.region?.toLowerCase().includes('malaysia')
  ) {
    modifiers.push({
      modifier: 'non_compete_malaysia',
      adjustment: 'informational',
      message: `Non-compete clauses are generally not enforceable under Malaysian law (Contracts Act 1950, Section 28). You may have more protection than this contract suggests.`
    })
  }

  return {
    ...riskResult,
    riskScore: Math.min(riskScore, 100),
    riskLevel: getRiskLevel(riskScore),
    contextModifiers: modifiers
  }
}
