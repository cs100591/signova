BEFORE DOING ANYTHING:
1. Read memory.md — understand full project state
2. Show me:
   - Where are Looks Good, Tell Me More, Explain Simply buttons rendered?
   - What do they currently do (if anything)?
   - Where is the Ask AI chat mode component?
   - How is finding card state currently managed?
   - Where are findings stored in Supabase?
3. List ALL files you plan to create or modify
4. Wait for my confirmation before writing any code

PROTECTION RULES — NON NEGOTIABLE
⛔ DO NOT modify any existing analysis logic
⛔ DO NOT modify risk score calculation
⛔ DO NOT modify Terminal animation
⛔ DO NOT modify Explain Simply (already working)
⛔ DO NOT modify any auth, workspace, or billing logic
⛔ DO NOT install new packages without telling me first
⛔ ONLY touch finding card buttons and chat context injection

━━━━━━━━━━━━━━━━━━━━━━
FEATURE 1 — Looks Good
━━━━━━━━━━━━━━━━━━━━━━
Behavior:
  User clicks [Looks Good] on a finding card
  → Finding is marked as acknowledged
  → Card visually dims (opacity 0.5)
  → Button changes to ✓ Acknowledged (green)
  → State persists — user reopens contract, still dimmed
  → Does NOT affect risk score (score is objective)
  → User can click again to un-acknowledge (toggle)

Supabase — add to contract_analyses table:
  acknowledged_findings: text[] DEFAULT '{}'
  (array of finding rule IDs that user acknowledged)

```sql
ALTER TABLE contract_analyses
  ADD COLUMN IF NOT EXISTS
  acknowledged_findings text[] DEFAULT '{}';
```

Save logic:
  On click Looks Good:
  const updatedAcknowledged = isAcknowledged
    ? acknowledged.filter(id => id !== finding.rule)
    : [...acknowledged, finding.rule]

  await supabase
    .from('contract_analyses')
    .update({ acknowledged_findings: updatedAcknowledged })
    .eq('id', analysisId)

Visual states:
  Default:
    Button: [👍 Looks Good]
    Card: full opacity

  Acknowledged:
    Button: [✓ Acknowledged] color #16a34a
    Card: opacity 0.5
    Finding title: strikethrough or muted color #9a8f82

━━━━━━━━━━━━━━━━━━━━━━
FEATURE 2 — Tell Me More
━━━━━━━━━━━━━━━━━━━━━━
Behavior:
  User clicks [Tell Me More] on a finding card
  → Opens Ask AI chat mode
  → AI already has full context:
      contract text
      existing analysis results
      this specific finding
      user's party (from existing analysis)
  → AI opens with a targeted message about this finding
  → User can ask follow-up questions freely

Navigation:
  If on contract detail page:
    Open chat panel/modal (do not navigate away)
    OR navigate to AI Terminal with context params

  Pass finding context via URL params or state:
    ?contractId=xxx&findingRule=no_termination_clause

AI opening message for Tell Me More:

  System prompt injection:
  "The user clicked Tell Me More on this specific finding:
   Rule: ${finding.rule}
   Issue: ${finding.message}
   Severity: ${finding.severity}
   Points: ${finding.points}

   Open the conversation by:
   1. Acknowledging this specific clause
   2. Explaining what it means in plain language
   3. Explaining the real-world impact for their party
   4. Offering to discuss negotiation options

   Do NOT ask which party they are again.
   Party is already known: ${selectedParty}
   Use their party name directly."

  AI opening example:
  "Let's talk about the No Termination for Convenience clause.

   As [Wayne Enterprises / receiving party], this means you are
   locked into this NDA for the full 3-year term with no exit.
   Even if the business relationship breaks down or becomes
   commercially unviable, you cannot walk away.

   Want me to explain how to negotiate this, or what happens
   if you breach it?"

━━━━━━━━━━━━━━━━━━━━━━
CHAT CONTEXT INJECTION (used by both Ask AI and Tell Me More)
━━━━━━━━━━━━━━━━━━━━━━
Whenever entering chat mode from a contract page,
always inject this context into system prompt:

  // Fetch contract
  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .single()

  // Fetch latest analysis
  const { data: analysis } = await supabase
    .from('contract_analyses')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const systemPrompt = `
    You are reviewing a specific contract for the user.

    CONTRACT: ${contract.title}
    TYPE: ${contract.contract_type}
    FULL TEXT: ${contract.extracted_text}

    EXISTING ANALYSIS:
    Risk Score: ${analysis.risk_score}/100
    Risk Level: ${analysis.risk_level}
    Findings: ${JSON.stringify(analysis.breakdown)}
    User Party: ${analysis.selected_party}
    Party Name: ${analysis.party_a_name or analysis.party_b_name}

    Do NOT re-analyze the contract from scratch.
    Use existing findings as reference.
    Answer from the user party perspective.
    Always refer to user by their party name.
  `

━━━━━━━━━━━━━━━━━━━━━━
EXECUTION ORDER
━━━━━━━━━━━━━━━━━━━━━━
Step 1 — Audit
  Show finding card component
  Show current button handlers
  Show Ask AI chat entry point
  Wait for confirmation

Step 2 — Looks Good feature
  Add acknowledged_findings column to contract_analyses
  Add toggle logic to Looks Good button
  Save acknowledged state to Supabase
  Update card visual on acknowledged state
  Test: click Looks Good → dims → reopen → still dimmed
  git commit: "feat: Looks Good acknowledges finding"

Step 3 — Tell Me More feature
  Wire Tell Me More button to open chat mode
  Pass finding context (rule, message, severity) to chat
  Inject finding-specific opening into AI system prompt
  AI opens conversation targeting that specific clause
  Test: click Tell Me More → chat opens → AI addresses that clause
  git commit: "feat: Tell Me More opens contextual chat"

Step 4 — Chat context injection
  Always load contract + analysis data when entering chat
  Inject into system prompt automatically
  No need to re-upload or re-analyze
  Test: Ask AI from contract page → AI knows the contract
  git commit: "feat: chat auto-loads contract and analysis context"

Step 5 — Update memory.md:
  acknowledged_findings column location
  Tell Me More chat context injection
  How finding rule ID is passed to chat
  Chat system prompt structure for contract context
