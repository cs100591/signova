# Signova — Party Selection, Onboarding & Extraction Flow
> Covers: Onboarding questions, profile settings, pre-analysis party selection, Layer 1 quick extraction
> Depends on: docs/signova-ai-engine.md

---

## Overview

Four connected pieces that work together:

- Onboarding: collect user context once, stored in Supabase profiles
- Profile Settings: user can edit preferences anytime
- Quick Extraction: extract party names before showing modal
- Party Selection: user picks their side, AI analyzes from that perspective

---

## Part 1 — Supabase Schema Updates

### profiles table

Add columns:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  company_size text
  CHECK (company_size IN (
    'individual', 'small_business', 'sme', 'enterprise'
  ));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  contract_types text[] DEFAULT '{}';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  analysis_style text DEFAULT 'balanced'
  CHECK (analysis_style IN (
    'flag_everything', 'balanced', 'dealbreakers_only'
  ));
```

### contract_analyses table

Add columns:

```sql
ALTER TABLE contract_analyses
  ADD COLUMN IF NOT EXISTS selected_party text,
  ADD COLUMN IF NOT EXISTS party_a_name text,
  ADD COLUMN IF NOT EXISTS party_b_name text;
```

---

## Part 2 — Onboarding Extra Questions

Add 3 new steps after existing onboarding steps.

### Question 1 — Company Size

Saves to: profiles.company_size

```
What best describes you?

○ Individual / Freelancer       → 'individual'
○ Small Business (< 10 people)  → 'small_business'
○ SME (10 – 100 people)         → 'sme'
○ Enterprise (100+ people)      → 'enterprise'
```

### Question 2 — Contract Types

Saves to: profiles.contract_types (text array)
Minimum 1 required.

```
What contracts do you deal with most?
Select all that apply.

☑ Employment
☑ Freelance / Contractor
☑ NDA / Confidentiality
☑ Lease / Rental
☑ SaaS / Software
☑ Business / Vendor
☑ Other
```

### Question 3 — Analysis Style

Saves to: profiles.analysis_style

```
How should I review your contracts?

○ Flag everything
  I want to know every risk, even minor ones
  → 'flag_everything'

○ Balanced  ← default
  Show me important risks, skip minor details
  → 'balanced'

○ Deal-breakers only
  Only flag serious issues that could hurt me significantly
  → 'dealbreakers_only'
```

### How analysis_style affects AI (add to buildSystemPrompt)

```javascript
const ANALYSIS_STYLE_INSTRUCTIONS = {
  flag_everything: `
    Flag ALL risks including minor ones.
    Include LOW severity findings.
    Better to over-inform than under-inform.
  `,
  balanced: `
    Focus on significant risks.
    Skip minor or standard clauses.
    Only include LOW severity if truly unusual.
  `,
  dealbreakers_only: `
    Only flag HIGH severity issues.
    Skip MEDIUM and LOW findings entirely.
    User wants executive summary only.
  `
}
```

---

## Part 3 — Profile Settings (Editable)

Add AI Preferences section to Settings > Profile,
below existing fields:

```
── AI Preferences ───────────────────────
I am a...         [Individual ▾        ]
Contract types    [☑ NDA  ☑ SaaS  ...  ]
Analysis style    [Balanced ▾          ]
```

### Always fetch fresh profile before AI calls

```javascript
const { data: profile } = await supabase
  .from('profiles')
  .select('region, jurisdiction, language, company_size, contract_types, analysis_style')
  .eq('id', userId)
  .single()

const systemPrompt = buildSystemPrompt(profile)
```

### Save logic

```javascript
await supabase
  .from('profiles')
  .update({
    company_size: companySize,
    contract_types: contractTypes,
    analysis_style: analysisStyle,
    updated_at: new Date().toISOString()
  })
  .eq('id', userId)
```

---

## Part 4 — Pre-Analysis Party Selection

### Flow

```
User uploads PDF
      ↓
Quick Extraction API (separate fast call)
  max_tokens: 200
  target: < 3 seconds
  only extracts: party names + roles
      ↓
Party Selection Modal
  shows real party names
  user selects their side
      ↓
Terminal animation starts
Full analysis runs with party context injected
```

### Quick Extraction API

Create: app/api/extract-parties/route.js

Prompt:
```
Extract ONLY the following from this contract.
Return ONLY valid JSON, no other text.

{
  "party_a": {
    "name": "full legal name of first party",
    "role": "their role e.g. Employer, Landlord, Service Provider"
  },
  "party_b": {
    "name": "full legal name of second party",
    "role": "their role e.g. Employee, Tenant, Client"
  },
  "contract_type": "one line description"
}

If a party name cannot be found, use null.
Contract text: [CONTRACT_TEXT]
```

### Party Selection Modal

File: components/PartySelectionModal.jsx

When names found:
```
Before I analyze — which party are you?

[ CloudBase Sdn Bhd      ]   selected: border #c8873a, bg #fffbf5
  Service Provider

[ Pemandu Analytics      ]
  Client

○ I am reviewing for someone else
○ Not sure
```

When names not found:
```
○ Party A (first party in contract)
○ Party B (second party in contract)
○ I am reviewing for someone else
○ Not sure
```

### Party context for Layer 4 narrative

```javascript
const PARTY_CONTEXT = {
  party_a: `
    The user is ${extracted.party_a?.name || 'Party A'}
    acting as ${extracted.party_a?.role || 'the first party'}.
    Analyze ALL clauses from their perspective.
    Flag risks that disadvantage them.
    Always refer to them by name, not as 'Party A'.
  `,
  party_b: `
    The user is ${extracted.party_b?.name || 'Party B'}
    acting as ${extracted.party_b?.role || 'the second party'}.
    Analyze ALL clauses from their perspective.
    Flag risks that disadvantage them.
    Always refer to them by name, not as 'Party B'.
  `,
  reviewing: `
    The user is reviewing this contract on behalf of someone else.
    Provide neutral analysis of both sides.
    Flag significant risks for both parties.
  `,
  unsure: `
    Analyze from the perspective of the less powerful party.
    Flag all risks clearly.
  `
}
```

### Updated analyzeContract.js signature

```javascript
export const analyzeContract = async (
  contractText,
  userProfile,
  selectedParty    // new: 'party_a' | 'party_b' | 'reviewing' | 'unsure'
) => {

  const extracted = await runExtraction(contractText)
  const riskResult = calculateRisk(extracted)
  const contextResult = applyContextModifier(riskResult, extracted, userProfile)

  // Pass both selectedParty and analysis_style into narrative
  const narrative = await generateNarrative(
    extracted,
    contextResult,
    userProfile,
    selectedParty
  )

  await supabase.from('contract_analyses').insert({
    ...existingFields,
    selected_party: selectedParty,
    party_a_name: extracted.party_a?.name,
    party_b_name: extracted.party_b?.name
  })

  return { extracted, riskResult, contextResult, narrative }
}
```

---

## Part 5 — Complete User Journey

```
First time user:
  Sign up
  → Onboarding:
      Name, jurisdiction, language  (existing)
      Company size                   (new)
      Contract types                 (new)
      Analysis style                 (new)
  → Dashboard

Every analysis:
  Upload PDF
  → Quick extraction (party names, ~2-3s)
  → Party selection modal
  → Select party
  → Terminal animation
  → Full analysis from selected perspective
  → Results

Update preferences anytime:
  Settings → Profile → AI Preferences → Save
  → Affects all future analyses immediately
```

---

## Claude Code Prompt

```
BEFORE DOING ANYTHING:
1. Read memory.md — understand full project state
2. Read docs/signova-ai-engine.md
3. Read docs/signova-party-onboarding.md — this spec
4. Show me:
   - Current profiles table columns in Supabase
   - Current onboarding flow files
   - Current profile settings page file
   - Current analyzeContract.js location
5. List ALL files you plan to create or modify
6. Wait for my confirmation before writing any code

PROTECTION RULES — NON NEGOTIABLE
⛔ DO NOT modify any existing auth logic
⛔ DO NOT modify any existing contract logic
⛔ DO NOT modify any existing UI components
   unless explicitly listed below
⛔ DO NOT modify workspace or billing logic
⛔ DO NOT install new packages without telling me first

Allowed to MODIFY:
✅ Onboarding flow — add 3 new steps at the end only
✅ Settings Profile page — add AI Preferences section only
✅ lib/analyzeContract.js — add selectedParty parameter
✅ lib/buildSystemPrompt.js — add party context and analysis_style

Allowed to CREATE:
✅ app/api/extract-parties/route.js
✅ components/PartySelectionModal.jsx

EXECUTION ORDER

Step 1 — Audit
  Show profiles table schema (all columns)
  Show onboarding flow files
  Show profile settings page
  Show analyzeContract.js
  Wait for my confirmation before any changes

Step 2 — Supabase schema
  profiles: add company_size, contract_types, analysis_style
  contract_analyses: add selected_party, party_a_name, party_b_name
  Screenshot tables to confirm
  git commit: "feat: schema update for party and preferences"

Step 3 — Update onboarding
  Add 3 new steps after existing steps only
  Save all 3 fields to Supabase profiles on completion
  Screenshot each new step
  git commit: "feat: onboarding AI preference questions"

Step 4 — Update Profile Settings page
  Add AI Preferences section below existing fields
  Pre-populate from existing Supabase profile data
  Save via existing Save Changes button
  Screenshot updated page
  git commit: "feat: AI preferences in profile settings"

Step 5 — Create extract-parties API
  app/api/extract-parties/route.js
  max_tokens: 200 only — keep it fast
  git commit: "feat: quick party extraction API"

Step 6 — Create PartySelectionModal
  components/PartySelectionModal.jsx
  Real names from extraction
  Fallback to Party A / Party B if null
  4 options: party_a, party_b, reviewing, unsure
  Screenshot modal
  git commit: "feat: party selection modal"

Step 7 — Update analyzeContract.js
  Add selectedParty parameter
  Inject PARTY_CONTEXT into Layer 4 prompt
  Inject ANALYSIS_STYLE_INSTRUCTIONS into prompt
  Save party fields to contract_analyses
  git commit: "feat: party-aware analysis"

Step 8 — Wire up full flow
  PDF upload → quick extraction → party modal → full analysis
  Test end to end with a real contract PDF
  Screenshot full flow
  git commit: "feat: complete party-aware analysis flow"

Step 9 — Update memory.md:
  New profiles columns and purpose
  New contract_analyses columns
  extract-parties API location
  PartySelectionModal location
  How selectedParty flows into analysis
  How analysis_style affects narrative
  Full analysis sequence
```

---

*Signova Party Selection and Onboarding Guide v1.0*
