import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { getContext } from '@/lib/vector-store';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    const context = await getContext(lastMessage.content);

    const { text } = await generateText({
      model: google('gemma-3-27b-it'),
      messages,
      // @ts-ignore
      maxTokens: 8192, // We force this to prevent cutoff
      system: `You are a smart study assistant. 
      - You ALWAYS format your answers in nice Markdown. 
      - Use **bold** for key terms.
      - Use lists for steps.
      - Use LaTeX for math equations (wrap inline math in $...$ and block math in $$...$$).
      - Answer ONLY using the context below.
      \n\nContext:\n${context}`,
    });

    return NextResponse.json({ role: 'assistant', content: text });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }

}
