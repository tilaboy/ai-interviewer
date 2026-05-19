import Anthropic from "@anthropic-ai/sdk";
import { buildInterviewerPrompt } from "@/lib/prompt-builder";
import type { InterviewConfig } from "@/lib/prompt-builder";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  config: InterviewConfig;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // --- Validate API key ---
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 },
    );
  }

  // --- Parse request body ---
  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  const { messages, config } = body;

  if (!config?.company || !config?.role || !config?.level || !config?.interviewType) {
    return Response.json(
      { error: "Missing required config fields: company, role, level, interviewType" },
      { status: 400 },
    );
  }

  // --- Build system prompt and select question ---
  let systemPrompt: string;
  try {
    const result = buildInterviewerPrompt(config);
    systemPrompt = result.systemPrompt;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: `Failed to build interview prompt: ${message}` },
      { status: 500 },
    );
  }

  // --- Prepare messages for Claude ---
  const claudeMessages: Anthropic.MessageParam[] = [];

  if (!messages || messages.length === 0) {
    // First call — the user hasn't said anything yet.
    // We send a synthetic user message to get the interviewer to introduce
    // themselves and start the interview.
    claudeMessages.push({
      role: "user",
      content:
        "[The candidate has joined the interview room. Please introduce yourself and begin the interview.]",
    });
  } else {
    // Subsequent calls — forward the conversation history.
    for (const msg of messages) {
      claudeMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  // --- Call Claude with streaming ---
  const client = new Anthropic({ apiKey });

  try {
    const stream = await client.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages,
      stream: true,
    });

    // Convert the Anthropic stream into a ReadableStream of text chunks
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return Response.json(
        { error: `Claude API error: ${err.message}` },
        { status: err.status ?? 502 },
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: `Failed to call Claude: ${message}` },
      { status: 500 },
    );
  }
}
