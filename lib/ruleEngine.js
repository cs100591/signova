/**
 * Layer 2 — Rule Engine
 * Deterministic risk scoring from extracted JSON.
 * Claude does NOT score here. All rules are explicit and auditable.
 */

export const RULE_ENGINE_VERSION = 'v1.0'

export const calculateRisk = (extracted) => {
  const breakdown = []
  let score = 0

  // ── LIABILITY ──────────────────────────────
  if (extracted.liability_cap?.type === 'uncapped') {
    breakdown.push({
      rule: 'uncapped_liability',
      points: 30,
      message: 'No liability cap — unlimited financial exposure'
    })
    score += 30
  }

  if (extracted.liability_cap?.type === 'capped') {
    const cap = extracted.liability_cap.cap_amount
    const value = extracted.contract_value
    if (cap && value && cap < value * 0.5) {
      breakdown.push({
        rule: 'low_liability_cap',
        points: 15,
        message: 'Liability cap is less than 50% of contract value'
      })
      score += 15
    }
  }

  // ── AUTO RENEWAL ───────────────────────────
  if (extracted.auto_renewal?.exists) {
    const notice = extracted.auto_renewal.notice_days
    if (notice === null) {
      breakdown.push({
        rule: 'auto_renewal_no_notice',
        points: 20,
        message: 'Auto-renewal exists but no notice period specified'
      })
      score += 20
    } else if (notice > 30) {
      breakdown.push({
        rule: 'auto_renewal_long_notice',
        points: 15,
        message: `Auto-renewal requires ${notice} days notice — easy to miss`
      })
      score += 15
    }
  }

  // ── TERMINATION ────────────────────────────
  if (!extracted.termination_for_convenience?.exists) {
    breakdown.push({
      rule: 'no_termination_clause',
      points: 20,
      message: 'No termination for convenience — locked in for full term'
    })
    score += 20
  }

  if (extracted.termination_for_convenience?.exists) {
    const notice = extracted.termination_for_convenience.notice_days
    if (notice > 60) {
      breakdown.push({
        rule: 'long_termination_notice',
        points: 10,
        message: `${notice} day termination notice is longer than standard`
      })
      score += 10
    }
  }

  // ── DISPUTE RESOLUTION ─────────────────────
  if (extracted.dispute_resolution?.type === 'arbitration') {
    const location = extracted.dispute_resolution.location
    breakdown.push({
      rule: 'arbitration_clause',
      points: 10,
      message: `Arbitration in ${location || 'unspecified location'} — limits court access`
    })
    score += 10
  }

  // ── IP OWNERSHIP ───────────────────────────
  if (extracted.ip_ownership?.type === 'client_owns_all') {
    breakdown.push({
      rule: 'ip_assigned_to_client',
      points: 15,
      message: 'All IP transfers to client — including pre-existing work'
    })
    score += 15
  }

  // ── NON COMPETE ────────────────────────────
  if (extracted.non_compete?.exists) {
    const months = extracted.non_compete.duration_months
    if (months > 12) {
      breakdown.push({
        rule: 'long_non_compete',
        points: 15,
        message: `${months} month non-compete is above industry standard`
      })
      score += 15
    } else if (months > 0) {
      breakdown.push({
        rule: 'non_compete_exists',
        points: 8,
        message: `${months} month non-compete restricts future work`
      })
      score += 8
    }
  }

  // ── PAYMENT ────────────────────────────────
  if (extracted.payment_terms_days > 60) {
    breakdown.push({
      rule: 'long_payment_terms',
      points: 10,
      message: `Net ${extracted.payment_terms_days} payment terms — cash flow risk`
    })
    score += 10
  }

  // ── DATA PROTECTION ────────────────────────
  if (!extracted.data_protection?.exists) {
    breakdown.push({
      rule: 'no_data_protection',
      points: 10,
      message: 'No data protection clause — risk under PDPA / GDPR'
    })
    score += 10
  }

  // ── CAP SCORE AT 100 ──────────────────────
  const finalScore = Math.min(score, 100)

  return {
    riskScore: finalScore,
    riskLevel: getRiskLevel(finalScore),
    breakdown,
    ruleVersion: RULE_ENGINE_VERSION
  }
}

const getRiskLevel = (score) => {
  if (score <= 39) return 'SAFE'
  if (score <= 69) return 'NEGOTIATE'
  return 'HIGH RISK'
}
