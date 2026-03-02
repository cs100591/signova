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

    const { question, contractText, contractId, userProfile } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // 1. Fetch conversation_history for current contract (if any)
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

    // 2. We'll skip pgvector search for past contracts for now since we'd need to generate embeddings on upload first.
    // We'll implement that in a separate step or module if needed.

    // 3. Save user's question to conversation_history
    if (contractId) {
      await supabase.from('conversation_history').insert({
        user_id: user.id,
        contract_id: contractId,
        role: 'user',
        content: question
      });
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(userProfile || {});

    // Build user prompt
    let userPrompt = question;
    if (contractText) {
      userPrompt = `Contract Context:\n${contractText.substring(0, 3000)}\n\nUser Question: ${question}`;
    }

    const messages = [
      ...conversationHistory,
      { role: 'user', content: userPrompt }
    ];

    // Check if we want to stream or not. For now we will return a generated text response.
    const result = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      system: systemPrompt,
      messages: messages,
      maxTokens: 1000,
      temperature: 0.7,
    } as any);

    // Save assistant's response to conversation_history
    if (contractId) {
      await supabase.from('conversation_history').insert({
        user_id: user.id,
        contract_id: contractId,
        role: 'assistant',
        content: result.text
      });
    }

    return NextResponse.json({ response: result.text });
  } catch (error: any) {
    console.error('Terminal chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}
