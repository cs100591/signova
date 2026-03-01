import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

// 简单分析 - 使用 Haiku 4.5（快速、便宜，适合基础询问）
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

// 深度分析 - 使用 Sonnet 4.6（高质量，适合复杂分析）
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

  // 合同审核用 Sonnet 4.6（高质量，适合深度分析）
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
  
  // 上传提取用 Haiku 4.5（快速、便宜、最新版）
  const aiPromise = generateText({
    model: anthropic('claude-haiku-4-5'),
    prompt,
  });
  
  const { text } = await Promise.race([aiPromise, timeoutPromise]) as { text: string };

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
