import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

// 简单分析 - 使用 Haiku 4.5（快速、便宜，适合基础询问）
export async function analyzeContractSimple(contractText: string, focusArea: string, userProfile?: any) {
  const systemPrompt = buildSystemPrompt(userProfile);
  
  const prompt = `Analyze this contract clause focused on ${focusArea}:

${contractText}

Provide:
1. What the clause says (1 sentence)
2. Why it matters (1 sentence)  
3. What's typical in industry (1 sentence)
4. Suggested improvement (if applicable)`;

  const result = await generateText({
    model: anthropic('claude-haiku-4-5'),
    system: systemPrompt,
    prompt,
  });

  return result.text;
}

// 深度分析 - 使用 Sonnet 4.6（高质量，适合复杂分析）
export async function analyzeContract(
  contractText: string, 
  focusArea: string,
  userProfile?: any
) {
  const systemPrompt = buildSystemPrompt(userProfile);
  
  const prompt = `Analyze the following contract. Focus on: ${focusArea}

Return your analysis in EXACTLY this structure:

---RISK_SCORE---
[number 0-100]
[one-line verdict]

---FINDINGS---
For each risk found (order by severity):

FINDING_START
category: [Termination|Liability|Payment|IP|Confidentiality|Other]
severity: [HIGH|MEDIUM|LOW]
title: [short name]
issue: [what's wrong]
quote: [exact text from contract]
explanation: [why this matters]
suggestion: [rewritten clause]
FINDING_END

---MISSING---
List standard protections that are absent

---SUMMARY---
[Exactly 3 bullet points — most important things before signing]

Contract text:
${contractText}`;

  const result = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    system: systemPrompt,
    prompt,
  });

  return result.text;
}

// Streaming 版本 - 用于实时显示
export async function* analyzeContractStream(
  contractText: string,
  focusArea: string,
  userProfile?: any
) {
  const systemPrompt = buildSystemPrompt(userProfile);
  
  const prompt = `Analyze the following contract. Focus on: ${focusArea}

Provide a comprehensive analysis including:
1. Risk score (0-100)
2. Key findings with severity levels
3. Industry comparisons
4. Suggested improvements
5. Summary of critical points

Contract text:
${contractText}`;

  const result = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    system: systemPrompt,
    prompt,
  });

  // 模拟流式输出，按字符逐个返回
  const text = result.text;
  const chunkSize = 5;
  
  for (let i = 0; i < text.length; i += chunkSize) {
    yield text.slice(i, i + chunkSize);
    // 小延迟模拟打字效果
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

export async function extractMetadata(contractText: string, userProfile?: any) {
  const systemPrompt = buildSystemPrompt(userProfile);
  
  const prompt = `Extract the following from the contract and return ONLY valid JSON:

{
  "title": "descriptive contract title",
  "type": "MSA | NDA | Employment | Contractor | Renewal | Lease | Service | Other",
  "summary": "2-3 sentence plain language summary, max 80 words",
  "parties": {
    "party_a": "first party name",
    "party_b": "second party name"
  },
  "dates": {
    "effective_date": "YYYY-MM-DD or null",
    "expiry_date": "YYYY-MM-DD or null"
  },
  "value": {
    "amount": null or number,
    "currency": "USD/MYR/SGD/GBP/EUR or null"
  },
  "governing_law": "jurisdiction if mentioned",
  "risk_preview": "one sentence preview of biggest risk"
}

Contract:
${contractText}`;

  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      system: systemPrompt,
      prompt,
    });

    return JSON.parse(result.text);
  } catch {
    return null;
  }
}

// 构建动态 System Prompt
function buildSystemPrompt(userProfile?: any) {
  const jurisdiction = userProfile?.country || 'General';
  const language = userProfile?.language || 'English';
  
  return `You are Signova Intelligence, an expert contract risk analyst.

Your mission is to help everyday users understand contract risks and protect their interests.

Context:
- User Jurisdiction: ${jurisdiction}
- Preferred Language: ${language}

Core principles:
1. ALWAYS take the perspective of the person who uploaded the contract
2. Use plain language — explain to a smart friend, not a judge
3. Be specific — quote actual clause text when flagging issues
4. Be honest — if something is standard, say so
5. Prioritize actionable advice

Risk classification:
🔴 HIGH — Significant financial loss or legal liability
🟡 MEDIUM — Worth negotiating, leaves user exposed
🟢 LOW — Standard industry clause

IMPORTANT: Always end with:
"⚠️ This analysis is for informational purposes only and does not constitute legal advice."`;
}
