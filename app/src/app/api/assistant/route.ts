import { streamChat } from "@/lib/ai-client";

interface AssistantRequestBody {
  prompt: string;
  code: string;
  language: string;
  context?: string;
}

const ASSISTANT_SYSTEM_PROMPT = `You are a helpful coding assistant embedded in a code editor. You help developers write, debug, and improve code.

Your behavior:
- Respond concisely with code snippets, brief explanations, or both.
- When showing code, use fenced code blocks with the appropriate language tag.
- Focus on being practical — give working code the developer can use right away.
- If the request is ambiguous, make a reasonable assumption and go with it.
- Keep explanations short. Developers prefer code over prose.
- You can see the developer's current code context when provided.
- You are a general-purpose coding assistant. Just help the developer with whatever they ask.
- Do not ask clarifying questions unless the request is truly impossible to answer without more info.
- Sometimes suggest alternative approaches if there's a clearly better way to do something.`;

export async function POST(request: Request) {
  let body: AssistantRequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  const { prompt, code, language, context } = body;

  if (!prompt || typeof prompt !== "string") {
    return Response.json(
      { error: "Missing required field: prompt" },
      { status: 400 },
    );
  }

  // Build the user message with code context
  const parts: string[] = [];

  if (code && code.trim()) {
    parts.push(`Current code (${language || "unknown"}):\n\`\`\`${language || ""}\n${code}\n\`\`\``);
  }

  if (context) {
    parts.push(`Additional context: ${context}`);
  }

  parts.push(`Request: ${prompt}`);

  const userMessage = parts.join("\n\n");

  try {
    const stream = await streamChat({
      systemPrompt: ASSISTANT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: `AI provider error: ${message}` },
      { status: 502 },
    );
  }
}
