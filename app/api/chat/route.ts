import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { getContext } from '@/lib/vector-store';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    const context = await getContext(lastMessage.content);

    const result = streamText({
      model: google('gemma-3-27b-it'),
      messages, // automatically passes the history
      system: `You are an expert Study Assistant and Tutor.
      temperature: 0.1,
      Your goal is to explain complex topics simply and clearly in less number of words as possible.

      **CRITICAL INSTRUCTION - READ CAREFULLY:**
      1. You MUST separate different logical sections of your answer using EXACTLY this string: ===SECTION_BREAK===
      
      RULES:
      a. Do NOT format the separator (no bold, no italics).
      b. Place the separator on its own new line.
      c. Example Output:
         "Here is the introduction...
         
         ===SECTION_BREAK===
         
         Here is step 1..."   
         
      2. **Deep Dives**: If a section is very detailed (like a long math proof, code block, or derivation), wrap it in a collapsible HTML details tag.
         - Format:
           <details>
           <summary>Click to view proof/code</summary>
           
           (Put your Markdown/Math content here. Ensure there is a blank line above this line)
           
           </details>
           
      3. Use **bold** for key terms.
      
      4. **Lists**: Use bullet points or numbered lists whenever possible to break down steps or features.
      
      5. **Comparisons**: IF the user asks to compare two or more things, YOU MUST use a Markdown Table.
      
      6. **Code**: If a code example is relevant, use standard Markdown code blocks (e.g., \`\`\`python ... \`\`\`) for block code and single backticks (\`variable\`) for inline code.
      
      7. **Math**: Use LaTeX for equations (wrap inline in $...$ and block in $$...$$).
      
      8. **Tone**: Friendly, encouraging, and professional.

      Answer ONLY using the context below.
      \n\nContext:\n${context}`,
    });

    return result.toTextStreamResponse();
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Error processing request' }), { status: 500 });
  }
}





