/**
 * Layer 4 — Narrative Layer
 * Builds the prompt for Claude Sonnet to generate human-readable analysis.
 * Claude does NOT score here. Claude only explains.
 */

const PARTY_CONTEXT = {
  party_a: (extracted) => `
The user is ${extracted?.party_a?.name || 'Party A'} acting as ${extracted?.party_a?.role || 'the first party'}.
Analyze ALL clauses from their perspective.
Flag risks that disadvantage them specifically.
Always refer to them by name, not as 'Party A'.
`,
  party_b: (extracted) => `
The user is ${extracted?.party_b?.name || 'Party B'} acting as ${extracted?.party_b?.role || 'the second party'}.
Analyze ALL clauses from their perspective.
Flag risks that disadvantage them specifically.
Always refer to them by name, not as 'Party B'.
`,
  reviewing: () => `
The user is reviewing this contract on behalf of someone else.
Provide neutral analysis of both sides.
Flag significant risks for both parties equally.
`,
  unsure: () => `
Analyze from the perspective of the less powerful party in this contract.
Flag all risks clearly without assuming which side the user is on.
`,
};

const ANALYSIS_STYLE_INSTRUCTIONS = {
  flag_everything: `
Flag ALL risks including minor ones.
Include LOW severity findings.
Better to over-inform than under-inform.
`,
  balanced: `
Focus on significant risks.
Skip minor or standard clauses that are industry-normal.
Only include LOW severity if truly unusual.
`,
  dealbreakers_only: `
Only flag HIGH severity issues.
Skip MEDIUM and LOW findings entirely.
User wants executive summary of genuine deal-breakers only.
`,
};

export const buildNarrativePrompt = (extracted, riskResult, userProfile, selectedParty) => {
  const partyCtx = selectedParty && PARTY_CONTEXT[selectedParty]
    ? PARTY_CONTEXT[selectedParty](extracted)
    : PARTY_CONTEXT.unsure();

  const styleCtx = ANALYSIS_STYLE_INSTRUCTIONS[userProfile?.analysis_style]
    || ANALYSIS_STYLE_INSTRUCTIONS.balanced;

  return `You are a legal analyst writing for a business owner, not a lawyer. Use clear, plain language.

USER PROFILE:
- Region: ${userProfile?.region || 'Unknown'}
- Jurisdiction: ${userProfile?.jurisdiction || 'Unknown'}
- Language: ${userProfile?.language || 'English'}
- Company size: ${userProfile?.company_size || 'unknown'}

PERSPECTIVE:
${partyCtx}

ANALYSIS STYLE:
${styleCtx}

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
`;
};

/**
 * Parse raw Claude response into narrative JSON
 */
export const parseNarrativeResponse = (text) => {
  const clean = text.replace(/```json|```/g, '').trim();
  // Try direct parse first
  try {
    return JSON.parse(clean);
  } catch {
    // Extract JSON object from response if Claude added surrounding text
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('No valid JSON found in narrative response');
  }
};
