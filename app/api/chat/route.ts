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
      system: `You are an expert Study Assistant and Tutor.
      Your goal is to explain complex topics simply and clearly.

      **STRICT FORMATTING RULES:**
      1. **Spacing**: Break long text into small, digestible paragraphs (max 2-3 sentences).
      2. Use **bold** for key terms.
      3. **Lists**: Use bullet points or numbered lists whenever possible to break down steps or features.
      4. **Comparisons**: IF the user asks to compare two or more things, YOU MUST use a Markdown Table.
      5. **Code**: If a code example is relevant, use standard Markdown code blocks (e.g., \`\`\`python ... \`\`\`) for block code and single backticks (\`variable\`) for inline code.
      6. **Math**: Use LaTeX for equations (wrap inline in $...$ and block in $$...$$).
      7. **Tone**: Friendly, encouraging, and professional.

      Answer ONLY using the context below. If the context is missing, say so politely.
      \n\nContext:\n${context}`,
    });

    return NextResponse.json({ role: 'assistant', content: text });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }

}

