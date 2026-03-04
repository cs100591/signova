
BEFORE DOING ANYTHING:
1. Read memory.md — understand full project state
2. Show me:
   - Where is the party selection question currently triggered?
   - Where is the upload/save flow?
   - Where is Start AI Analysis button and its logic?
   - Where is the Ask AI button (top right) and its logic?
   - Where is AI Terminal upload/paste flow?
   - Where are all Ask AI buttons rendered?
   - How is the AI chat response currently rendered?
3. List ALL files you plan to create or modify
4. Wait for my confirmation before writing any code

PROTECTION RULES — NON NEGOTIABLE
⛔ DO NOT modify any existing auth logic
⛔ DO NOT modify any existing contract save/upload logic
⛔ DO NOT modify workspace or billing logic
⛔ DO NOT modify AI analysis engine (lib/analyzeContract.js)
⛔ DO NOT modify any component not explicitly listed below
⛔ DO NOT install new packages without telling me first
⛔ DO NOT remove Version History, Export PDF, or Delete Contract

━━━━━━━━━━━━━━━━━━━━━━
BUG 1 — Party Selection triggered at wrong place
━━━━━━━━━━━━━━━━━━━━━━
Current behavior:
  Party selection question triggers on contract upload/save
  This is wrong — user is just saving, not analyzing yet

Expected behavior:

  Trigger Party Selection Modal:
  ✅ Contract page → user clicks [Start AI Analysis]
  ✅ Contract page → user clicks [Analyze Again]
  ✅ AI Terminal → user uploads PDF then clicks Analyze
  ✅ AI Terminal → user pastes text then clicks Analyze

  Do NOT trigger Party Selection:
  ❌ Contract upload / save flow
  ❌ Skip & ask general questions (chat mode)
  ❌ Ask AI button (chat mode, handled differently — see Bug 2)
  ❌ Viewing existing analysis results

Fix:
  Remove party selection from upload/save flow entirely
  Add PartySelectionModal trigger to Start AI Analysis button
  Add PartySelectionModal trigger to Analyze Again button
  Add PartySelectionModal trigger to AI Terminal analyze flow

PartySelectionModal flow:
  User clicks Start AI Analysis or Analyze Again
      ↓
  Quick extraction API call (app/api/extract-parties)
  Extract party names from contract (max_tokens: 200)
      ↓
  PartySelectionModal appears with real party names:

  "Before I analyze — which party are you?"

  [ Party A real name    ]   [ Party B real name   ]
  [ Reviewing for someone else ]  [ Not sure ]

  Fallback if names not found: Party A / Party B
      ↓
  User selects → Terminal animation starts → Full analysis

━━━━━━━━━━━━━━━━━━━━━━
BUG 2 — Too many Ask AI buttons
━━━━━━━━━━━━━━━━━━━━━━
Current behavior:
  3 Ask AI buttons all doing the same thing:
  - Top right corner Ask AI
  - Analysis section "Ask AI About This"
  - Quick Actions Ask AI

Expected behavior:

  KEEP — Top right corner [Ask AI]:
    → Enters chat mode
    → AI automatically reads:
        contract full text
        existing analysis results (risk score, findings, breakdown)
    → AI asks which party in chat (NOT a modal):
        "I have reviewed [Contract Name] and your analysis.
         Before we chat — which party are you?
         Reply with the number or name."
        Then shows options as chat quick reply buttons
    → User selects party
    → AI uses contract + analysis data to answer questions
    → Does NOT re-run analysis
    → Does NOT show Terminal animation

  KEEP — Quick Actions Ask AI:
    Same behavior as top right Ask AI
    Remove one of them if they do exactly the same thing
    Keep only ONE Ask AI in Quick Actions

  DELETE — "Ask AI About This" button in Risk Score / Analysis section:
    Remove entirely
    Too many duplicates

  ADD — [Analyze Again] button:
    Show only when analysis results already exist
    Triggers Party Selection Modal → full re-analysis
    Replaces Start AI Analysis when results exist

━━━━━━━━━━━━━━━━━━━━━━
BUG 3 — AI response appears all at once
━━━━━━━━━━━━━━━━━━━━━━
Current behavior:
  AI response renders all at once after full generation
  No streaming, no gradual appearance

Expected behavior:
  Text streams in gradually word by word
  Like ChatGPT / Claude streaming effect
  Smooth, not chunky

Fix — implement streaming in chat mode:

  In the AI chat API route, use streaming response:

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages: messages
  })

  Return as ReadableStream:
  return new Response(stream.toReadableStream(), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    }
  })

  On frontend, read the stream:

  const response = await fetch('/api/chat', { ... })
  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  let fullText = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    fullText += chunk
    // Update message state with each chunk
    setMessages(prev => [
      ...prev.slice(0, -1),
      { ...prev[prev.length - 1], content: fullText }
    ])
  }

  Streaming applies to:
  ✅ Ask AI chat mode (contract page)
  ✅ AI Terminal chat mode (general questions)
  ✅ AI Terminal after analysis (follow-up questions)

  Does NOT apply to:
  ❌ Terminal analysis steps animation (keep as is)
  ❌ Finding cards (structured data, not streamed)

━━━━━━━━━━━━━━━━━━━━━━
ASK AI CHAT MODE — Context Injection
━━━━━━━━━━━━━━━━━━━━━━
When user enters Ask AI chat from contract page:

Automatically load and inject into system prompt:

  // Fetch contract text
  const { data: contract } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .single()

  // Fetch existing analysis if available
  const { data: analysis } = await supabase
    .from('contract_analyses')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Build context-aware system prompt
  const systemPrompt = `
    You are a legal assistant reviewing a specific contract.

    CONTRACT: ${contract.title}
    TYPE: ${contract.contract_type}
    FULL TEXT: ${contract.extracted_text}

    ${analysis ? `
    EXISTING ANALYSIS:
    Risk Score: ${analysis.risk_score}/100
    Risk Level: ${analysis.risk_level}
    Key Findings: ${JSON.stringify(analysis.breakdown)}
    Narrative: ${JSON.stringify(analysis.narrative)}
    ` : 'No analysis has been run yet.'}

    USER PARTY: ${selectedParty}
    (Set after user answers the party question)

    Use this context to answer all questions.
    Do NOT re-analyze the contract from scratch.
    Reference specific findings when relevant.
    Always answer from the user's party perspective.
  `

━━━━━━━━━━━━━━━━━━━━━━
EXECUTION ORDER
━━━━━━━━━━━━━━━━━━━━━━
Step 1 — Audit
  Show all files related to:
    party selection trigger
    Ask AI buttons
    AI chat response rendering
  Wait for confirmation

Step 2 — Fix Bug 1: Party Selection position
  Remove from upload/save flow
  Add to Start AI Analysis button
  Add to Analyze Again button
  Add to AI Terminal analyze trigger
  Screenshot Party Selection Modal appearing correctly
  git commit: "fix: party selection moved to analyze trigger"

Step 3 — Fix Bug 2: Ask AI cleanup
  Remove Ask AI About This from analysis section
  Add Analyze Again button (shows when results exist)
  Wire Ask AI to load contract + analysis context
  AI asks party question in chat (not modal)
  Screenshot updated contract page
  git commit: "fix: Ask AI cleanup and context injection"

Step 4 — Fix Bug 3: Streaming response
  Update chat API route to use streaming
  Update frontend to read and render stream
  Test: text appears gradually word by word
  Screenshot or screen record streaming effect
  git commit: "feat: streaming AI chat responses"

Step 5 — Update memory.md:
  Party selection trigger locations
  Ask AI chat mode context injection logic
  Streaming implementation location
  Analyze Again button location and behavior
  Difference between Ask AI and Start AI Analysis
