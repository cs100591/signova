import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { buildSystemPrompt } from '@/lib/buildSystemPrompt';
import { createSupabaseServerClient } from '@/lib/supabase';

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { question, contractText, contractId } = await request.json();

    if (!question) {
      return new Response(JSON.stringify({ error: 'Question is required' }), { status: 400 });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('country, preferred_language, contract_types')
      .eq('id', user.id)
      .single();

    const userProfileContext = {
      region: profile?.country,
      jurisdiction: profile?.country,
      language: profile?.preferred_language,
      contractTypes: profile?.contract_types || [],
      contractHistory: [],
      commonConcerns: []
    };

    // Fetch conversation history
    let conversationHistory: any[] = [];
    if (contractId) {
      const { data: history } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true })
        .limit(10);

      if (history) {
        conversationHistory = history.map(h => ({
          role: h.role,
          content: h.content
        }));
      }
    }

    // Save user question
    if (contractId) {
      try {
        await supabase.from('conversation_history').insert({
          user_id: user.id,
          contract_id: contractId,
          role: 'user',
          content: question
        });
      } catch {}
    }

    // Build base system prompt
    let systemPrompt = buildSystemPrompt(userProfileContext);

    // Inject contract + analysis context when contractId is present
    if (contractId) {
      try {
        const [contractRes, analysisRes] = await Promise.all([
          supabase
            .from('contracts')
            .select('name, type, party_a, party_b, governing_law, effective_date, expiry_date, summary')
            .eq('id', contractId)
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('contract_analyses')
            .select('risk_score, risk_level, selected_party, party_a_name, party_b_name, breakdown, narrative')
            .eq('contract_id', contractId)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
        ]);

        const contract = contractRes.data;
        const analysis = analysisRes.data;

        if (contract || analysis) {
          const partyName = analysis?.selected_party === 'party_a'
            ? (analysis?.party_a_name || contract?.party_a)
            : analysis?.selected_party === 'party_b'
              ? (analysis?.party_b_name || contract?.party_b)
              : null;

          const contractCtx = [
            `\n\n== CONTRACT CONTEXT ==`,
            contract?.name ? `Contract: ${contract.name}` : null,
            contract?.type ? `Type: ${contract.type}` : null,
            contract?.party_a && contract?.party_b ? `Parties: ${contract.party_a} and ${contract.party_b}` : null,
            contract?.governing_law ? `Governing Law: ${contract.governing_law}` : null,
            contract?.summary ? `Summary: ${contract.summary}` : null,
          ].filter(Boolean).join('\n');

          const analysisCtx = analysis ? [
            `\n== EXISTING ANALYSIS ==`,
            `Risk Score: ${analysis.risk_score}/100 (${analysis.risk_level})`,
            analysis.selected_party ? `User's Party: ${analysis.selected_party}${partyName ? ` (${partyName})` : ''}` : null,
            analysis.breakdown ? `Findings: ${JSON.stringify(analysis.breakdown).substring(0, 2000)}` : null,
            `\nINSTRUCTIONS:`,
            `- Do NOT re-analyze the contract from scratch`,
            `- Use existing findings as your reference`,
            partyName ? `- Always answer from ${partyName}'s perspective` : null,
            partyName ? `- Refer to the user as ${partyName} or "you"` : null,
            `- Do NOT ask which party the user is — it is already known`,
          ].filter(Boolean).join('\n') : '';

          systemPrompt = systemPrompt + contractCtx + analysisCtx;
        }
      } catch (ctxErr) {
        console.error('[Chat] Failed to load contract context:', ctxErr);
      }
    }

    let userPrompt = question;
    if (contractText && !contractId) {
      // Only use raw contractText if there's no contractId (no DB context)
      userPrompt = `Contract Context:\n${contractText.substring(0, 3000)}\n\nUser Question: ${question}`;
    }

    const messages = [
      ...conversationHistory,
      { role: 'user' as const, content: userPrompt }
    ];

    // Stream text and pipe manually as plain text chunks
    const result = streamText({
      model: anthropic('claude-sonnet-4-6'),
      system: systemPrompt,
      messages,
      maxTokens: 1000,
      temperature: 0.7,
    } as any);

    const { textStream } = result;
    const encoder = new TextEncoder();
    let fullText = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of textStream) {
            fullText += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (err) {
          console.error('[Chat] Stream error:', err);
          controller.error(err);
        } finally {
          controller.close();
          // Save assistant response after stream ends
          if (contractId && fullText) {
            try {
              await supabase.from('conversation_history').insert({
                user_id: user.id,
                contract_id: contractId,
                role: 'assistant',
                content: fullText
              });
            } catch (saveErr) {
              console.error('[Chat] Failed to save history:', saveErr);
            }
          }
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      }
    });
  } catch (error: any) {
    console.error('Terminal chat error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request', details: error.message }), { status: 500 });
  }
}
