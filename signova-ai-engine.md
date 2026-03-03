# Signova AI Engine — Architecture Upgrade
> Version: 1.0 | Status: Pre-launch
> Purpose: Claude Code implementation guide

---

## Overview

Current problem: Claude does everything in one pass.
- Unstable scoring
- Hard to explain
- Hard to upgrade
- Hard to compare contracts

New architecture: 4 separate layers.
Each layer has one job.

```
Contract PDF
    ↓
Layer 1 — Extraction (Claude)
    ↓
Layer 2 — Rule Engine (your code)
    ↓
Layer 3 — Context Modifier (user profile)
    ↓
Layer 4 — Narrative (Claude)
    ↓
UI Render
```

---

## Layer 1 — Clause Extraction

### Job
Extract structured data from contract text.
Do NOT analyze. Do NOT score. Only extract.

### Prompt

```
You are a contract data extraction engine.
Your only job is to extract structured data
from the contract text provided.

Rules:
- Extract only what is explicitly stated
- Do not infer or assume
- If a field is not found, use null
- Return confidence score per field (0.0 to 1.0)
- Return ONLY valid JSON, no other text

Contract text:
[CONTRACT_TEXT]
```

### Output Schema

```json
{
  "contract_type": "",
  "contract_type_confidence": 0.0,

  "parties": {
    "party_a": "",
    "party_b": "",
    "confidence": 0.0
  },

  "contract_value": null,
  "contract_value_currency": null,
  "contract_value_confidence": 0.0,

  "term_length_months": null,
  "term_length_confidence": 0.0,

  "start_date": null,
  "end_date": null,
  "date_confidence": 0.0,

  "auto_renewal": {
    "exists": false,
    "notice_days": null,
    "confidence": 0.0
  },

  "termination_for_convenience": {
    "exists": false,
    "notice_days": null,
    "confidence": 0.0
  },

  "termination_for_cause": {
    "exists": false,
    "confidence": 0.0
  },

  "liability_cap": {
    "exists": false,
    "type": null,
    "cap_amount": null,
    "cap_multiplier": null,
    "confidence": 0.0
  },

  "governing_law": {
    "country": null,
    "state": null,
    "confidence": 0.0
  },

  "dispute_resolution": {
    "type": null,
    "location": null,
    "body": null,
    "confidence": 0.0
  },

  "ip_ownership": {
    "type": null,
    "confidence": 0.0
  },

  "non_compete": {
    "exists": false,
    "duration_months": null,
    "scope": null,
    "confidence": 0.0
  },

  "non_solicitation": {
    "exists": false,
    "duration_months": null,
    "confidence": 0.0
  },

  "indemnification": {
    "exists": false,
    "mutual": false,
    "confidence": 0.0
  },

  "data_protection": {
    "exists": false,
    "standard": null,
    "confidence": 0.0
  },

  "payment_terms_days": null,
  "payment_terms_confidence": 0.0,

  "late_payment_interest": {
    "exists": false,
    "rate_percent_monthly": null,
    "confidence": 0.0
  }
}
```

### Confidence Rules
```
confidence >= 0.8 → clearly stated in contract
confidence 0.5-0.79 → implied or inferred
confidence < 0.5 → uncertain, flag for review
```

### Flag for review
If any critical field has confidence < 0.7:
- Show warning badge on that Finding Card
- Text: "AI confidence low — verify manually"
- Critical fields: liability_cap, governing_law,
  termination_for_convenience, auto_renewal

### Parse on frontend
```javascript
const text = await response.text()
const clean = text.replace(/```json|```/g, '').trim()
const extracted = JSON.parse(clean)
```

---

## Layer 2 — Rule Engine

### Job
Calculate risk score from extracted JSON.
Do NOT use Claude for scoring.
Rules are deterministic and explainable.

### File location
```
lib/ruleEngine.js
```

### Version
```javascript
export const RULE_ENGINE_VERSION = "v1.0"
```
Always save this version with every analysis result.
Allows recalculating old contracts when rules change.

### Rules

```javascript
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
    // Low cap relative to contract value is risky
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
```

### Score Breakdown saved to Supabase
```javascript
// Save with every analysis
{
  contract_id: uuid,
  risk_score: 72,
  risk_level: 'HIGH RISK',
  rule_version: 'v1.0',
  breakdown: [...],  // full array
  extracted_data: {...},  // full JSON
  analyzed_at: timestamp
}
```

---

## Layer 3 — Context Modifier

### Job
Adjust risk score based on user profile.
Makes Signova a Decision Engine, not just an analysis tool.

### File location
```
lib/contextModifier.js
```

### User profile fields needed
```javascript
// From profiles table in Supabase
{
  region: 'Malaysia',
  jurisdiction: 'Malaysian law',
  annual_revenue_range: 'RM500K-2M',  // optional
  risk_tolerance: 'low',               // optional
  company_size: 'SME'                  // optional
}
```

### Revenue ranges (collect in onboarding — optional field)
```
< RM500K
RM500K – RM2M
RM2M – RM10M
> RM10M
Prefer not to say
```

### Modifier rules

```javascript
export const applyContextModifier = (
  riskResult,
  extracted,
  userProfile
) => {
  let { riskScore, breakdown } = riskResult
  const modifiers = []

  // ── LIABILITY vs REVENUE ───────────────────
  const revenueMap = {
    '< RM500K': 500000,
    'RM500K-2M': 2000000,
    'RM2M-10M': 10000000,
    '> RM10M': null
  }

  const revenue = revenueMap[userProfile.annual_revenue_range]
  const liabilityCap = extracted.liability_cap?.cap_amount

  if (revenue && liabilityCap) {
    const ratio = liabilityCap / revenue
    if (ratio > 0.1) {
      // Liability > 10% of revenue → force HIGH RISK
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
  const userRegion = userProfile.region

  if (
    contractJurisdiction &&
    contractJurisdiction.toLowerCase() !== userRegion.toLowerCase()
  ) {
    modifiers.push({
      modifier: 'jurisdiction_mismatch',
      adjustment: +10,
      message: `Contract uses ${contractJurisdiction} law
                but you are based in ${userRegion}.
                Cross-border enforcement may be difficult.`
    })
    riskScore = Math.min(riskScore + 10, 100)
  }

  // ── NON COMPETE ENFORCEABILITY ─────────────
  if (
    extracted.non_compete?.exists &&
    userProfile.region === 'Malaysia'
  ) {
    modifiers.push({
      modifier: 'non_compete_malaysia',
      adjustment: 'informational',
      message: `Non-compete clauses are generally not enforceable
                under Malaysian law (Contracts Act 1950, Section 28).
                You may have more protection than this contract suggests.`
    })
  }

  return {
    ...riskResult,
    riskScore: Math.min(riskScore, 100),
    riskLevel: getRiskLevel(riskScore),
    contextModifiers: modifiers
  }
}
```

---

## Layer 4 — Narrative Layer

### Job
Generate human-readable analysis from structured data.
Claude does NOT score. Claude only explains.

### Input to Claude

```javascript
const narrativePrompt = `
You are a legal analyst writing for a business owner,
not a lawyer. Use clear, plain language.

USER PROFILE:
- Region: ${userProfile.region}
- Jurisdiction: ${userProfile.jurisdiction}
- Language: ${userProfile.language}
- Company size: ${userProfile.company_size || 'unknown'}

CONTRACT DATA:
${JSON.stringify(extracted, null, 2)}

RISK SCORE: ${riskResult.riskScore} / 100
RISK LEVEL: ${riskResult.riskLevel}

RISK BREAKDOWN:
${riskResult.breakdown.map(b =>
  `- ${b.message} (+${b.points} points)`
).join('\n')}

CONTEXT MODIFIERS:
${riskResult.contextModifiers.map(m =>
  `- ${m.message}`
).join('\n')}

Generate the following sections in ${userProfile.language}.
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
```

### Parse narrative output
```javascript
const text = await response.text()
const clean = text.replace(/```json|```/g, '').trim()
const narrative = JSON.parse(clean)
```

---

## Complete Flow

### File structure
```
lib/
  extractionPrompt.js    ← Layer 1 prompt builder
  ruleEngine.js          ← Layer 2 scoring
  contextModifier.js     ← Layer 3 profile adjustment
  narrativePrompt.js     ← Layer 4 prompt builder
  analyzeContract.js     ← orchestrates all 4 layers
```

### Orchestrator

```javascript
// lib/analyzeContract.js

export const analyzeContract = async (
  contractText,
  userProfile
) => {

  // Layer 1 — Extract
  const extractionResponse = await callClaude(
    buildExtractionPrompt(contractText)
  )
  const extracted = JSON.parse(extractionResponse)

  // Layer 2 — Score
  const riskResult = calculateRisk(extracted)

  // Layer 3 — Modify with context
  const contextResult = applyContextModifier(
    riskResult,
    extracted,
    userProfile
  )

  // Layer 4 — Narrate
  const narrativeResponse = await callClaude(
    buildNarrativePrompt(extracted, contextResult, userProfile)
  )
  const narrative = JSON.parse(narrativeResponse)

  // Save to Supabase
  await saveAnalysis({
    extracted,
    riskScore: contextResult.riskScore,
    riskLevel: contextResult.riskLevel,
    breakdown: contextResult.breakdown,
    contextModifiers: contextResult.contextModifiers,
    narrative,
    ruleVersion: RULE_ENGINE_VERSION,
    analyzedAt: new Date()
  })

  return {
    extracted,
    riskScore: contextResult.riskScore,
    riskLevel: contextResult.riskLevel,
    breakdown: contextResult.breakdown,
    contextModifiers: contextResult.contextModifiers,
    narrative
  }
}
```

---

## UI Mapping

### Risk Score Card
```
source: riskScore (from Layer 2 + 3)
0-39:  green  #16a34a  "Safe"
40-69: amber  #d97706  "Negotiate"
70+:   red    #dc2626  "High Risk"
```

### Finding Cards
```
source: breakdown (from Layer 2)
Each breakdown item = one Finding Card

Card fields:
- title: breakdown.rule (human readable)
- severity: HIGH if points >= 20, MEDIUM if >= 10, LOW if < 10
- issue: breakdown.message
- explanation: narrative.negotiationPoints[matching].reason
- suggestion: narrative.negotiationPoints[matching].suggestedChange
- confidence: extracted[relevant_field].confidence
```

### Context Modifier Banner
```
source: contextModifiers (from Layer 3)
Show as info banner above Finding Cards

e.g.:
ℹ️ Based on your profile (Malaysian SME):
   Non-compete clauses are generally not enforceable
   under Malaysian law.
```

### Decision Signal
```
source: narrative.decisionSignal
Show prominently below Risk Score Card

"Safe to sign"              → green
"Negotiate before signing"  → amber
"Do not sign without legal review" → red
```

### Red Lines
```
source: narrative.redLines
Show as separate section with ⛔ icon
These are deal-breakers, not negotiation points
```

### Positives
```
source: narrative.positives
Show as collapsible section with ✅ icon
"What this contract gets right"
```

---

## Supabase Schema

### contract_analyses table
```sql
CREATE TABLE contract_analyses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id uuid REFERENCES contracts(id),
  user_id uuid REFERENCES auth.users(id),

  -- Layer 1
  extracted_data jsonb,

  -- Layer 2
  risk_score integer,
  risk_level text,
  rule_version text,
  breakdown jsonb,

  -- Layer 3
  context_modifiers jsonb,

  -- Layer 4
  narrative jsonb,

  analyzed_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now()
);
```

---

## Implementation Order

```
Week 1:
  ① Write extraction prompt
  ② Test on 5 mock contracts (the ones we generated)
  ③ Verify JSON schema completeness
  ④ Adjust prompt until accuracy > 85%

Week 2:
  ⑤ Write ruleEngine.js (start with 10 rules)
  ⑥ Test scores on same 5 contracts
  ⑦ Validate scores feel right

Week 3:
  ⑧ Write contextModifier.js
  ⑨ Add revenue range to onboarding (optional field)
  ⑩ Test jurisdiction mismatch detection

Week 4:
  ⑪ Write narrative prompt
  ⑫ Connect all 4 layers in analyzeContract.js
  ⑬ Connect to existing UI
  ⑭ Full end-to-end test
```

---

## Claude Code Prompt

```
BEFORE DOING ANYTHING:
1. Read memory.md — understand current project state
2. Read docs/signova-ai-engine.md — this spec
3. List ALL files you plan to create or modify
4. Wait for my confirmation before touching any code

━━━━━━━━━━━━━━━━━━━━━━
PROTECTION RULES — NON NEGOTIABLE
━━━━━━━━━━━━━━━━━━━━━━
⛔ DO NOT modify any existing UI components
⛔ DO NOT modify any existing API routes
⛔ DO NOT modify any existing Supabase queries
⛔ DO NOT modify buildSystemPrompt.js
⛔ DO NOT modify any auth or session logic
⛔ DO NOT modify any workspace logic
⛔ DO NOT change any environment variables
⛔ DO NOT install new packages without telling me first
⛔ DO NOT let Claude score risk in any layer
⛔ DO NOT skip confidence scores in extraction

You are ONLY allowed to:
✅ Create new files in lib/
✅ Create contract_analyses table in Supabase
✅ Connect new analyzeContract.js to existing
   analysis trigger point (read memory.md for location)
✅ Add new fields to existing analysis result display

━━━━━━━━━━━━━━━━━━━━━━
IMPLEMENTATION
━━━━━━━━━━━━━━━━━━━━━━
Implement the 4-layer AI engine as specified
in docs/signova-ai-engine.md.

New files to create (ONLY these):
lib/extractionPrompt.js   ← Layer 1
lib/ruleEngine.js         ← Layer 2
lib/contextModifier.js    ← Layer 3
lib/narrativePrompt.js    ← Layer 4
lib/analyzeContract.js    ← Orchestrator

━━━━━━━━━━━━━━━━━━━━━━
EXECUTION ORDER
━━━━━━━━━━━━━━━━━━━━━━
Step 1 — Read memory.md, show me:
  - Where is the current analyzeContract function?
  - Where is the current AI call for analysis?
  - What does the current analysis result look like?
  Wait for confirmation.

Step 2 — Create Layer 1 (extractionPrompt.js)
  Test on 5 mock contracts in outputs/
  Show me the extraction output before proceeding
  git commit: "feat: Layer 1 clause extraction"

Step 3 — Create Layer 2 (ruleEngine.js)
  Show me risk scores for the same 5 contracts
  Validate scores feel reasonable
  git commit: "feat: Layer 2 rule engine v1.0"

Step 4 — Create Layer 3 (contextModifier.js)
  Test with userProfile from Supabase
  Show before/after score comparison
  git commit: "feat: Layer 3 context modifier"

Step 5 — Create Layer 4 (narrativePrompt.js)
  Show narrative output for one contract
  git commit: "feat: Layer 4 narrative layer"

Step 6 — Create Orchestrator (analyzeContract.js)
  Connect all 4 layers
  git commit: "feat: AI engine orchestrator"

Step 7 — Create Supabase table
  contract_analyses table as per spec
  git commit: "feat: contract_analyses table"

Step 8 — Connect to existing UI
  ONLY replace the existing analyzeContract call
  DO NOT change anything else
  Screenshot to confirm working
  git commit: "feat: connect 4-layer engine to UI"

Step 9 — Update memory.md:
  - Location of all 4 layer files
  - Location of orchestrator
  - Rule engine version
  - contract_analyses table structure
  - How to add new rules in future
```

---

## Why This Architecture Works

```
Stable      → Rule engine always gives same score for same input
Explainable → Every point has a reason
Auditable   → breakdown saved with every analysis
Upgradeable → Change rules without touching Claude prompts
Investable  → Can demo the scoring logic to investors
Replaceable → Can swap Claude for any model in Layer 1 and 4
Extensible  → Add industry-specific rules later
             Add benchmark data later
             Add lawyer verification layer later
```

---

*Signova AI Engine v1.0 | Architecture Document*
