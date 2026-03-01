import { NextResponse } from 'next/server';
import { analyzeContract, analyzeContractSimple } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { contractText, focusArea, analysisDepth = 'deep', userCountry = 'United States' } = await request.json();
    
    if (!contractText) {
      return NextResponse.json(
        { error: 'Missing required fields: contractText is required' },
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
    
    // Select model based on analysisDepth
    if (analysisDepth === 'simple') {
      // Simple analysis - Using Haiku 4.5 (fast, cheap)
      analysis = await analyzeContractSimple(contractText, focusArea);
    } else {
      // Deep analysis - Using Sonnet 4.6 (high quality)
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
