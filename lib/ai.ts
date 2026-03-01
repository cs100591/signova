import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

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
