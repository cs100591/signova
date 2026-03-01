import { NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

export async function POST(request: Request) {
  try {
    const { contractText, focusArea, analysisDepth = 'deep', userProfile } = await request.json();
    
    if (!contractText || !focusArea) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        analysis: `## Analysis of ${focusArea} Clause

**What clause says:**
The clause requires 90 days' notice for termination.

**Why it matters:**
Longer notice periods reduce operational flexibility and may incur unnecessary costs if you need to switch vendors quickly.

**What is typical:**
Most SaaS contracts use 30 days' notice. Some enterprise agreements use 60 days, but 90 days is unusually long.

**Suggested improvement:**
~~ninety (90) days~~ → **thirty (30) days**

This aligns with industry standards while still providing reasonable transition time.`,
        riskScore: 72,
      });
    }
    
    // 构建 system prompt
    const systemPrompt = buildSystemPrompt(userProfile);
    
    // 选择模型
    const model = analysisDepth === 'simple' 
      ? anthropic('claude-haiku-4-5')
      : anthropic('claude-sonnet-4-6');
    
    const prompt = analysisDepth === 'simple'
      ? `Analyze this contract clause focused on ${focusArea}:\n\n${contractText}\n\nProvide:\n1. What the clause says\n2. Why it matters\n3. What's typical\n4. Suggested improvement`
      : `Analyze the following contract and return a single valid JSON object:

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

Focus areas: ${focusArea}

Contract:
${contractText}

CRITICAL OUTPUT RULES:
- Return ONLY a valid JSON object
- Do NOT include any markdown text, headers, or explanation outside the JSON
- Do NOT include \`\`\`json code blocks
- Do NOT add any text before or after the JSON
- The UI will automatically display the disclaimer — do not include it in output
- Your entire response must be parseable by JSON.parse()`;

    const result = await generateText({
      model,
      system: systemPrompt,
      prompt,
    });

    // 尝试解析为结构化数据
    let response: any = {
      analysis: result.text,
      model: analysisDepth === 'simple' ? 'haiku-4.5' : 'sonnet-4.6',
    };

    // 如果是深度分析，解析 JSON 响应
    if (analysisDepth === 'deep') {
      try {
        // 清理可能的 markdown 代码块
        const cleanText = result.text
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        
        const parsed = JSON.parse(cleanText);
        
        // 如果成功解析，使用结构化数据
        if (parsed.riskScore !== undefined) {
          response = {
            ...parsed,
            model: 'sonnet-4.6',
            _parsed: true, // 标记为成功解析
          };
        }
      } catch (e) {
        // 解析失败，返回原始文本
        console.error('JSON parse failed:', e);
        response._parseError = true;
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze contract' },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(userProfile?: any) {
  const jurisdiction = userProfile?.country || 'General';
  const language = userProfile?.language || 'English';
  
  return `You are Signova Intelligence, an expert contract risk analyst helping everyday users understand contract risks.

Context:
- User Jurisdiction: ${jurisdiction}
- Language: ${language}

Principles:
1. Take the user's perspective (the one signing the contract)
2. Use plain language, explain like to a smart friend
3. Quote actual clause text when flagging issues
4. Be honest about what's standard vs. problematic
5. Prioritize actionable advice

Risk levels:
🔴 HIGH - Significant financial/legal risk
🟡 MEDIUM - Worth negotiating
🟢 LOW - Standard clause

End with: "⚠️ This analysis is for informational purposes only and does not constitute legal advice."`;
}
