import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

// --- Structured analysis types ---
export interface Finding {
  category: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  issue: string;
  quote: string;
  explanation: string;
  suggestion: string;
}

export interface AnalysisResult {
  riskScore: number;
  riskVerdict: string;
  findings: Finding[];
  missing: string[];
  summary: string[];
}

function extractField(block: string, field: string): string {
  // Match "field: value" — value can span multiple lines until the next field or end
  const regex = new RegExp(`^${field}:\\s*([\\s\\S]*?)(?=\\n[a-z]+:|$)`, 'im');
  const match = block.match(regex);
  return match ? match[1].trim() : '';
}

function parseAnalysisResult(text: string): AnalysisResult {
  // Risk score
  const scoreSection = text.match(/---RISK_SCORE---\s*(\d+)\s*\n(.+)/);
  const riskScore = scoreSection ? Math.min(100, Math.max(0, parseInt(scoreSection[1]))) : 50;
  const riskVerdict = scoreSection ? scoreSection[2].trim() : 'Contract review required';

  // Findings
  const findings: Finding[] = [];
  const findingMatches = [...text.matchAll(/FINDING_START([\s\S]*?)FINDING_END/g)];
  for (const match of findingMatches) {
    const block = match[1];
    findings.push({
      category: extractField(block, 'category') || 'Other',
      severity: (extractField(block, 'severity') || 'MEDIUM').toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW',
      title: extractField(block, 'title') || 'Finding',
      issue: extractField(block, 'issue') || '',
      quote: extractField(block, 'quote') || '',
      explanation: extractField(block, 'explanation') || '',
      suggestion: extractField(block, 'suggestion') || '',
    });
  }

  // Missing protections
  const missingSection = text.match(/---MISSING---\s*([\s\S]*?)(?=---SUMMARY---|$)/);
  const missing = missingSection
    ? missingSection[1].split('\n').map(l => l.replace(/^[-•*\d.]\s*/, '').trim()).filter(l => l.length > 10)
    : [];

  // Summary bullets
  const summarySection = text.match(/---SUMMARY---\s*([\s\S]*?)$/);
  const summary = summarySection
    ? summarySection[1].split('\n').map(l => l.replace(/^[•*]\s*/, '').trim()).filter(l => l.length > 5)
    : [];

  return { riskScore, riskVerdict, findings, missing, summary };
}

// Full structured analysis — returns AnalysisResult (used by /api/ai/analyze)
export async function analyzeContractFull(
  contractText: string,
  userCountry: string = 'United States'
): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const systemPrompt = `You are Signova Intelligence — an expert contract risk analyst protecting everyday people.

User Profile:
- Primary Jurisdiction: ${userCountry}
- Preferred Language: English

Your principles:
1. ALWAYS take the perspective of the user (the one uploading this contract)
2. Write in plain language — explain to a smart friend, not a judge
3. Be specific — quote exact clause text when flagging issues
4. Be honest — if a clause is standard, say "This is standard practice"
5. Prioritize real risks over theoretical ones`;

  const userPrompt = `Analyze the following contract. Return in EXACTLY this structure — do not deviate:

---RISK_SCORE---
{{number 0-100}}
{{one-line verdict}}

---FINDINGS---
For each risk (ordered by severity):

FINDING_START
category: {{Termination|Liability|Payment|IP|Confidentiality|Other}}
severity: {{HIGH|MEDIUM|LOW}}
title: {{short descriptive name}}
issue: {{what's problematic, one sentence}}
quote: {{exact text from contract, max 60 words}}
explanation: {{why this matters, 2-3 sentences}}
suggestion: {{rewritten clause suggestion for HIGH/MEDIUM risks}}
FINDING_END

---MISSING---
List standard protections that are absent (one per line, starting with -).

---SUMMARY---
• {{Most important thing to know}}
• {{Second most important}}
• {{Action item if any}}

Contract:
${contractText}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI analysis failed: ${response.status} — ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const rawText: string = data.content?.[0]?.text || '';
  return parseAnalysisResult(rawText);
}

// Simple analysis - Using Haiku 4.5 (fast, cheap, suitable for basic inquiries)
export async function analyzeContractSimple(contractText: string, focusArea: string) {
  const prompt = `Instruction:
  - Act as a calm AI contract analyst
  - Do not be academic
  - Do not produce legal advice
  - Follow output format rules

Input:
  - Clause text: ${contractText}
  - User focus: ${focusArea}

Output Format:
  1. What clause says: (1 sentence)
  2. Why it matters: (1 sentence)
  3. What is typical: (1 sentence, comparison)
  4. Suggested improvement: (inline diff format)

Tone: Clear, Human, Not verbose`;

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('AI analysis timed out')), 15000)
  );

  const aiPromise = generateText({
    model: anthropic('claude-haiku-4-5'),
    prompt,
  });

  const { text } = await Promise.race([aiPromise, timeoutPromise]) as { text: string };

  return text;
}

// Deep analysis - Using Sonnet 4.6 (high quality, suitable for complex analysis)
export async function analyzeContract(contractText: string, focusArea: string) {
  const prompt = `Instruction:
  - Act as a calm AI contract analyst
  - Do not be academic
  - Do not produce legal advice
  - Follow output format rules

Input:
  - Clause text: ${contractText}
  - User focus: ${focusArea}

Output Format:
  1. What clause says: (1 sentence)
  2. Why it matters: (1 sentence)
  3. What is typical: (1 sentence, comparison)
  4. Suggested improvement: (inline diff format)

Tone: Clear, Human, Not verbose`;

  // Contract review uses Sonnet 4.6 (high quality, suitable for deep analysis)
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('AI analysis timed out')), 20000)
  );

  const aiPromise = generateText({
    model: anthropic('claude-sonnet-4-6'),
    prompt,
  });

  const { text } = await Promise.race([aiPromise, timeoutPromise]) as { text: string };

  return text;
}

export async function extractMetadata(contractText: string) {
  const prompt = `Instruction:
  - Act as a calm AI contract analyst
  - Do not be academic
  - Do not produce legal advice
  - Follow output format rules

Input:
  - Contract text: ${contractText}

Output Format (JSON):
  {
    "contract_name": "string",
    "contract_type": "string",
    "party_a": "first party/company name",
    "party_b": "second party/company name",
    "amount": "string or null",
    "effective_date": "YYYY-MM-DD",
    "expiry_date": "YYYY-MM-DD",
    "summary": "80-120 words"
  }

Tone: Clear, Human, Not verbose`;

  // Add 15 second timeout to prevent hanging
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('AI analysis timed out')), 15000)
  );
  
  // Upload extraction uses Haiku 4.5 (fast, cheap, latest version)
  const aiPromise = generateText({
    model: anthropic('claude-haiku-4-5'),
    prompt,
  });
  
  const { text } = await Promise.race([aiPromise, timeoutPromise]) as { text: string };

  try {
    // Clean the response text to extract JSON
    let cleanedText = text.trim();
    
    // Remove markdown code blocks if present
    if (cleanedText.startsWith('```')) {
      const lines = cleanedText.split('\n');
      // Remove first line (```json or ```)
      lines.shift();
      // Remove last line if it's ```
      if (lines[lines.length - 1]?.trim() === '```') {
        lines.pop();
      }
      cleanedText = lines.join('\n').trim();
    }
    
    // Try to find JSON object in the text
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }
    
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error('[AI] Failed to parse JSON:', e, 'Original text:', text.slice(0, 200));
    return null;
  }
}
