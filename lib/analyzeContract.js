/**
 * Signova AI Engine — Orchestrator
 * Runs all 4 layers in sequence and saves results to Supabase.
 *
 * Layer 1 — Extraction  (Claude Haiku, JSON output)
 * Layer 2 — Rule Engine (deterministic scoring, no Claude)
 * Layer 3 — Context Modifier (profile-based adjustments, no Claude)
 * Layer 4 — Narrative   (Claude Sonnet, streaming-ready)
 */

import { buildExtractionPrompt, parseExtractionResponse, CRITICAL_FIELDS } from './extractionPrompt.js'
import { calculateRisk, RULE_ENGINE_VERSION } from './ruleEngine.js'
import { applyContextModifier } from './contextModifier.js'
import { buildNarrativePrompt, parseNarrativeResponse } from './narrativePrompt.js'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

/**
 * Call Anthropic API (non-streaming)
 */
const callClaude = async (model, prompt, system = '') => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const body = {
    model,
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  }
  if (system) body.system = system

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Claude API error: ${response.status} — ${errText.slice(0, 200)}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text || ''
}

/**
 * Annotate extracted fields with low-confidence warnings
 */
const flagLowConfidence = (extracted) => {
  const warnings = []
  for (const field of CRITICAL_FIELDS) {
    const obj = extracted[field]
    if (obj && typeof obj.confidence === 'number' && obj.confidence < 0.7) {
      warnings.push({
        field,
        confidence: obj.confidence,
        message: 'AI confidence low — verify manually'
      })
    }
  }
  return warnings
}

/**
 * Main orchestrator
 *
 * @param {string} contractText   - Full contract text
 * @param {object} userProfile    - User profile from Supabase profiles table
 * @param {object} [options]      - { contractId, userId, supabase, selectedParty }
 * @returns {object}              - Full analysis result
 */
export const analyzeContract = async (contractText, userProfile, options = {}) => {
  const { contractId, userId, supabase, selectedParty } = options

  // ── LAYER 1: EXTRACTION ─────────────────────────────────────────
  console.log('[AI Engine] Layer 1 — Extracting clauses...')
  let extracted, extractionRaw, confidenceWarnings
  try {
    const extractionPrompt = buildExtractionPrompt(contractText)
    extractionRaw = await callClaude('claude-haiku-4-5-20251001', extractionPrompt)
    extracted = parseExtractionResponse(extractionRaw)
    confidenceWarnings = flagLowConfidence(extracted)
    console.log('[AI Engine] Layer 1 complete. Warnings:', confidenceWarnings.length)
  } catch (err) {
    console.error('[AI Engine] Layer 1 failed:', err.message)
    throw err
  }

  // ── LAYER 2: RULE ENGINE ────────────────────────────────────────
  console.log('[AI Engine] Layer 2 — Running rule engine...')
  const riskResult = calculateRisk(extracted)
  console.log(`[AI Engine] Layer 2 complete. Score: ${riskResult.riskScore} (${riskResult.riskLevel})`)

  // ── LAYER 3: CONTEXT MODIFIER ───────────────────────────────────
  console.log('[AI Engine] Layer 3 — Applying context modifiers...')
  const contextResult = applyContextModifier(riskResult, extracted, userProfile)
  console.log(`[AI Engine] Layer 3 complete. Adjusted score: ${contextResult.riskScore}`)

  // ── LAYER 4: NARRATIVE ──────────────────────────────────────────
  console.log('[AI Engine] Layer 4 — Generating narrative...')
  let narrativeRaw, narrative
  try {
    const narrativePrompt = buildNarrativePrompt(extracted, contextResult, userProfile, selectedParty)
    narrativeRaw = await callClaude('claude-sonnet-4-6', narrativePrompt)
    narrative = parseNarrativeResponse(narrativeRaw)
    console.log('[AI Engine] Layer 4 complete.')
  } catch (err) {
    console.error('[AI Engine] Layer 4 failed:', err.message)
    throw err
  }

  // ── SAVE TO SUPABASE ────────────────────────────────────────────
  if (supabase && userId) {
    try {
      await supabase.from('contract_analyses').insert({
        contract_id: contractId || null,
        user_id: userId,
        extracted_data: extracted,
        risk_score: contextResult.riskScore,
        risk_level: contextResult.riskLevel,
        rule_version: RULE_ENGINE_VERSION,
        breakdown: contextResult.breakdown,
        context_modifiers: contextResult.contextModifiers,
        narrative,
        selected_party: selectedParty || null,
        party_a_name: extracted?.party_a?.name || null,
        party_b_name: extracted?.party_b?.name || null,
        analyzed_at: new Date().toISOString()
      })
      console.log('[AI Engine] Analysis saved to contract_analyses.')
    } catch (err) {
      // Non-fatal — don't fail the analysis if save fails
      console.error('[AI Engine] Failed to save analysis:', err.message)
    }
  }

  // ── RETURN RESULT ───────────────────────────────────────────────
  return {
    // Layer 1
    extracted,
    confidenceWarnings,
    // Layer 2 + 3
    riskScore: contextResult.riskScore,
    riskLevel: contextResult.riskLevel,
    breakdown: contextResult.breakdown,
    contextModifiers: contextResult.contextModifiers,
    ruleVersion: RULE_ENGINE_VERSION,
    // Layer 4
    narrative,
    // Legacy shape — keeps existing UI working
    riskVerdict: narrative.decisionSignal,
    findings: mapBreakdownToFindings(contextResult.breakdown, narrative),
    missing: [],
    summary: narrative.negotiationPoints?.slice(0, 3).map(p => p.reason) || []
  }
}

/**
 * Map rule engine breakdown to the legacy Finding shape
 * so existing UI components continue to work without changes.
 */
const mapBreakdownToFindings = (breakdown, narrative) => {
  const negotiationMap = {}
  for (const np of narrative.negotiationPoints || []) {
    negotiationMap[np.clause?.toLowerCase()] = np
  }

  return breakdown.map(item => {
    const severity =
      item.points >= 20 ? 'HIGH' :
      item.points >= 10 ? 'MEDIUM' : 'LOW'

    const matchedNP = Object.values(negotiationMap).find(np =>
      item.message.toLowerCase().includes(np.clause?.toLowerCase())
    )

    return {
      category: mapRuleToCategory(item.rule),
      severity,
      title: ruleToTitle(item.rule),
      issue: item.message,
      quote: '',
      explanation: matchedNP?.reason || item.message,
      suggestion: matchedNP?.suggestedChange || ''
    }
  })
}

const mapRuleToCategory = (rule) => {
  if (rule.includes('liability')) return 'Liability'
  if (rule.includes('renewal')) return 'Termination'
  if (rule.includes('termination')) return 'Termination'
  if (rule.includes('arbitration')) return 'Other'
  if (rule.includes('ip')) return 'IP'
  if (rule.includes('non_compete')) return 'Other'
  if (rule.includes('payment')) return 'Payment'
  if (rule.includes('data')) return 'Confidentiality'
  return 'Other'
}

const ruleToTitle = (rule) => {
  const titles = {
    uncapped_liability: 'Uncapped Liability',
    low_liability_cap: 'Low Liability Cap',
    auto_renewal_no_notice: 'Auto-Renewal (No Notice Period)',
    auto_renewal_long_notice: 'Auto-Renewal (Long Notice Required)',
    no_termination_clause: 'No Termination for Convenience',
    long_termination_notice: 'Long Termination Notice',
    arbitration_clause: 'Mandatory Arbitration',
    ip_assigned_to_client: 'IP Assigned to Client',
    long_non_compete: 'Extended Non-Compete',
    non_compete_exists: 'Non-Compete Clause',
    long_payment_terms: 'Long Payment Terms',
    no_data_protection: 'No Data Protection Clause'
  }
  return titles[rule] || rule.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
