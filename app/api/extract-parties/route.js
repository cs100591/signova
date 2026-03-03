import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export async function POST(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { contractText } = await request.json();
    if (!contractText || contractText.trim().length < 20) {
      return NextResponse.json({ error: 'contractText is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Return null names so UI can show Party A / Party B fallback
      return NextResponse.json({ party_a: null, party_b: null, contract_type: null });
    }

    const prompt = `Extract ONLY the following from this contract.
Return ONLY valid JSON, no other text.

{
  "party_a": {
    "name": "full legal name of first party",
    "role": "their role e.g. Employer, Landlord, Service Provider"
  },
  "party_b": {
    "name": "full legal name of second party",
    "role": "their role e.g. Employee, Tenant, Client"
  },
  "contract_type": "one line description"
}

If a party name cannot be found, use null for that party object.

Contract text:
${contractText.substring(0, 3000)}`;

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error('[extract-parties] Claude error:', response.status);
      return NextResponse.json({ party_a: null, party_b: null, contract_type: null });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json({
      party_a: parsed.party_a || null,
      party_b: parsed.party_b || null,
      contract_type: parsed.contract_type || null,
    });
  } catch (err) {
    console.error('[extract-parties] Error:', err.message);
    // Non-fatal — return nulls so UI shows fallback
    return NextResponse.json({ party_a: null, party_b: null, contract_type: null });
  }
}
