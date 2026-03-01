import { NextResponse } from 'next/server';
import { analyzeContractFull } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contractText, userCountry = 'United States' } = body;

    if (!contractText || contractText.trim().length < 20) {
      return NextResponse.json(
        { error: 'contractText is required and must be at least 20 characters' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      // Return realistic mock for demo / testing without key
      return NextResponse.json({
        riskScore: 62,
        riskVerdict: 'Moderate risk — several clauses need attention before signing',
        findings: [
          {
            category: 'Termination',
            severity: 'HIGH',
            title: 'No-cause termination with 90-day notice',
            issue: 'The other party can terminate this agreement without any reason as long as they give 90 days notice.',
            quote: 'Either party may terminate this Agreement for any reason upon ninety (90) days written notice.',
            explanation: 'This gives the counterparty wide latitude to end your engagement without fault. 90 days is longer than standard, locking you in even if circumstances change.',
            suggestion: 'Reduce notice period to 30 days and add mutual termination rights with compensation for work in progress.',
          },
          {
            category: 'Liability',
            severity: 'MEDIUM',
            title: 'Uncapped liability exposure',
            issue: 'There is no limit on your total financial liability under this contract.',
            quote: 'Party B shall be liable for all damages arising from breach of this Agreement.',
            explanation: 'Without a liability cap, you could owe unlimited damages even for minor mistakes. Most standard contracts cap liability at the contract value or 12 months of fees.',
            suggestion: "Add: \"In no event shall either party's total liability exceed the fees paid in the 12 months preceding the claim.\"",
          },
        ],
        missing: [
          'Intellectual property ownership clause (who owns the work product?)',
          'Dispute resolution / arbitration clause',
          'Force majeure protection',
        ],
        summary: [
          'The termination clause heavily favors the other party — negotiate for 30-day mutual notice.',
          'No liability cap puts you at significant financial risk — add one before signing.',
          'Consider having a lawyer review the IP ownership section before signing.',
        ],
      });
    }

    const result = await analyzeContractFull(contractText, userCountry);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[AI Analyze] Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze contract', details: error.message },
      { status: 500 }
    );
  }
}
