/**
 * Layer 1 — Clause Extraction
 * Builds the prompt for Claude Haiku to extract structured data from contract text.
 * Do NOT analyze. Do NOT score. Only extract.
 */

export const buildExtractionPrompt = (contractText) => `You are a contract data extraction engine.
Your only job is to extract structured data
from the contract text provided.

Rules:
- Extract only what is explicitly stated
- Do not infer or assume
- If a field is not found, use null
- Return confidence score per field (0.0 to 1.0)
- Return ONLY valid JSON, no other text

Contract text:
${contractText}

Return this exact JSON structure:
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
}`

/**
 * Fields that are "critical" — show warning badge if confidence < 0.7
 */
export const CRITICAL_FIELDS = [
  'liability_cap',
  'governing_law',
  'termination_for_convenience',
  'auto_renewal'
]

/**
 * Parse raw Claude response into extracted JSON
 */
export const parseExtractionResponse = (text) => {
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}
