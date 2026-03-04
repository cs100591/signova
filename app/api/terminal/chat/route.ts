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

    // Fetch conversation history for current contract (if any)
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

    // Save user question to conversation history
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

    const result = streamText({
      model: anthropic('claude-sonnet-4-6'),
      system: systemPrompt,
      messages,
      maxTokens: 1000,
      temperature: 0.7,
      onFinish: async ({ text }: { text: string }) => {
        // Save assistant response to history after stream completes
        if (contractId) {
          await supabase.from('conversation_history').insert({
            user_id: user.id,
            contract_id: contractId,
            role: 'assistant',
            content: text
          });
        }
      },
    } as any);

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Terminal chat error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request', details: error.message }), { status: 500 });
  }
}
