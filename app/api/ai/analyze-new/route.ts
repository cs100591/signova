import { NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { buildSystemPrompt } from '@/lib/buildSystemPrompt';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contractText, focusArea, analysisDepth = 'deep' } = await request.json();
    
    if (!contractText || !focusArea) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch user profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('country, preferred_language, contract_types')
      .eq('id', user.id)
      .single();
      
    const userProfileContext = {
      region: profileData?.country,
      jurisdiction: profileData?.country,
      language: profileData?.preferred_language,
      contractTypes: profileData?.contract_types || [],
      contractHistory: [],
      commonConcerns: []
    };
    
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
    
    // Build system prompt
    const systemPrompt = buildSystemPrompt(userProfileContext);
    
    // Select model
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

    // Attempt to parse as structured data
    let response: any = {
      analysis: result.text,
      model: analysisDepth === 'simple' ? 'haiku-4.5' : 'sonnet-4.6',
    };

    // If deep analysis, parse JSON response
    if (analysisDepth === 'deep') {
      try {
        // Clean possible markdown code blocks
        const cleanText = result.text
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        
        const parsed = JSON.parse(cleanText);
        
        // If successfully parsed, use structured data
        if (parsed.riskScore !== undefined) {
          response = {
            ...parsed,
            model: 'sonnet-4.6',
            _parsed: true, // Mark as successfully parsed
          };
        }
      } catch (e) {
        // Parse failed, return raw text
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
