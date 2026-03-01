import { NextResponse } from 'next/server';
import { analyzeContract, analyzeContractSimple } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { contractText, focusArea, analysisDepth = 'deep' } = await request.json();
    
    if (!contractText || !focusArea) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      // Return mock analysis for demo
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
      });
    }
    
    let analysis;
    
    // 根据 analysisDepth 选择模型
    if (analysisDepth === 'simple') {
      // 简单分析 - 使用 Haiku 4.5（快速、便宜）
      analysis = await analyzeContractSimple(contractText, focusArea);
    } else {
      // 深度分析 - 使用 Sonnet 4.6（高质量）
      analysis = await analyzeContract(contractText, focusArea);
    }

    return NextResponse.json({ 
      analysis,
      model: analysisDepth === 'simple' ? 'haiku-4.5' : 'sonnet-4.6'
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze contract' },
      { status: 500 }
    );
  }
}
