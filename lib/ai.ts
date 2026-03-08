import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { buildSystemPrompt } from './buildSystemPrompt';

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
  try {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```/, '').replace(/```$/, '').trim();
    }
    const result = JSON.parse(clean);
    return {
      riskScore: result.riskScore || 50,
      riskVerdict: result.riskVerdict || 'Contract review required',
      findings: result.findings || [],
      missing: result.missing || [],
      summary: result.summary || []
    };
  } catch (e) {
    console.error('Failed to parse AI JSON:', e, text);
    return {
      riskScore: 50,
      riskVerdict: 'Analysis failed to parse.',
      findings: [],
      missing: [],
      summary: []
    };
  }
}

// Full structured analysis — returns AnalysisResult (used by /api/ai/analyze)
export async function analyzeContractFull(
  contractText: string,
  userProfile: any = {}
): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const systemPrompt = buildSystemPrompt(userProfile);

  const userPrompt = `Analyze the following contract.

CRITICAL OUTPUT RULES:
- Return ONLY a valid JSON object
- Do NOT include any markdown text, headers, or explanation outside the JSON
- Do NOT include \`\`\`json code blocks
- Do NOT add any text before or after the JSON
- The UI will automatically display the disclaimer — do not include it in output
- Your entire response must be parseable by JSON.parse()

Return exactly this structure:
{
  "riskScore": [0-100 integer],
  "riskVerdict": "one-line verdict e.g. High risk — 2 clauses need attention",
  "findings": [
    {
      "category": "Termination|Liability|Payment|IP|Confidentiality|Other",
      "severity": "HIGH|MEDIUM|LOW",
      "title": "short clause name",
      "issue": "what's wrong in one sentence",
      "quote": "exact text from contract, max 60 words",
      "explanation": "plain language explanation, 2-3 sentences",
      "suggestion": "rewritten clause for HIGH/MEDIUM, empty string for LOW"
    }
  ],
  "missing": ["missing protection 1", "missing protection 2"],
  "summary": [
    "most important thing before signing",
    "second most important thing",
    "third most important — action item"
  ]
}

Focus areas: General Risk Assessment

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
    "amount": "number or null — the single primary contract value as a plain number WITHOUT currency symbols, commas, or text. For recurring payments (e.g. monthly salary/rent), return ONLY the recurring amount, not the total. Examples: 5500, 120000, 49.99. Return null if no clear monetary value.",
    "currency": "3-letter currency code (USD, MYR, SGD, GBP, EUR, AUD, etc.) or null",
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
