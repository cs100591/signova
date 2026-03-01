import { NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

export async function POST(request: Request) {
  try {
    const { question, contractText, history } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Build system prompt
    const systemPrompt = `You are Signova Intelligence, an expert AI contract analyst and legal assistant.

Your role:
1. Help users understand legal concepts and contract terms
2. Analyze contracts when provided with text
3. Answer general legal questions in plain language
4. Provide practical advice, not just legal theory

Guidelines:
- Always write in clear, simple language that a non-lawyer can understand
- Be honest about limitations - recommend consulting a lawyer for complex matters
- When analyzing contracts, identify risks and suggest improvements
- Keep responses concise but informative (150-300 words)
- Never provide definitive legal advice - always include a disclaimer

Tone: Professional, helpful, and calm.`;

    // Build user prompt
    let userPrompt = question;
    
    if (contractText) {
      userPrompt = `Contract Text:\n${contractText}\n\nUser Question: ${question}`;
    }

    // Add conversation history for context
    let messages = [];
    if (history && history.length > 0) {
      messages = history.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));
    }

    // Generate response
    const result = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      system: systemPrompt,
      messages: [
        ...messages,
        { role: 'user', content: userPrompt },
      ],
      maxTokens: 1000,
      temperature: 0.7,
    });

    // Add disclaimer
    const response = `${result.text}\n\n---\n*⚠️ This analysis is for informational purposes only and does not constitute legal advice. For important matters, please consult a qualified attorney.*`;

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('Terminal chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}
