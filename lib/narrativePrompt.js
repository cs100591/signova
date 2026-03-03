/**
 * Layer 4 — Narrative Layer
 * Builds the prompt for Claude Sonnet to generate human-readable analysis.
 * Claude does NOT score here. Claude only explains.
 */

export const buildNarrativePrompt = (extracted, riskResult, userProfile) => `
You are a legal analyst writing for a business owner,
not a lawyer. Use clear, plain language.

USER PROFILE:
- Region: ${userProfile?.region || 'Unknown'}
- Jurisdiction: ${userProfile?.jurisdiction || 'Unknown'}
- Language: ${userProfile?.language || 'English'}
- Company size: ${userProfile?.company_size || 'unknown'}

CONTRACT DATA:
${JSON.stringify(extracted, null, 2)}

RISK SCORE: ${riskResult.riskScore} / 100
RISK LEVEL: ${riskResult.riskLevel}

RISK BREAKDOWN:
${riskResult.breakdown.map(b =>
  `- ${b.message} (+${b.points} points)`
).join('\n')}

CONTEXT MODIFIERS:
${(riskResult.contextModifiers || []).map(m =>
  `- ${m.message}`
).join('\n') || 'None'}

Generate the following sections in ${userProfile?.language || 'English'}.
Return ONLY valid JSON, no other text.

{
  "financialImpact": "2-3 sentences about money at risk",
  "decisionSignal": "one clear sentence: safe to sign / negotiate first / do not sign without legal review",
  "negotiationPoints": [
    {
      "priority": "HIGH",
      "clause": "clause name",
      "currentText": "what it says now",
      "suggestedChange": "what to ask for",
      "reason": "why this matters to you"
    }
  ],
  "businessExplanation": "3-4 sentences in plain language, no jargon",
  "redLines": [
    "clause or condition that should be a deal-breaker"
  ],
  "positives": [
    "things in this contract that actually protect you"
  ]
}

Rules:
- negotiationPoints: maximum 5, ranked by priority
- redLines: only include genuine deal-breakers
- positives: include if they exist, do not invent
- decisionSignal must be one of:
  "Safe to sign" /
  "Negotiate before signing" /
  "Do not sign without legal review"
- Return ONLY valid JSON
`

/**
 * Parse raw Claude response into narrative JSON
 */
export const parseNarrativeResponse = (text) => {
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}
