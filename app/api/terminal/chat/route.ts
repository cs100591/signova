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
      await supabase.from('conversation_history').insert({
        user_id: user.id,
        contract_id: contractId,
        role: 'user',
        content: question
      });
    }

    const systemPrompt = buildSystemPrompt(userProfileContext);

    let userPrompt = question;
    if (contractText) {
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
