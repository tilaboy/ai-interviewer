import { buildInterviewerPrompt } from "@/lib/prompt-builder";
import { streamChat } from "@/lib/ai-client";
import type { InterviewConfig } from "@/lib/prompt-builder";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  config: InterviewConfig;
}

export async function POST(request: Request) {
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

  const chatMessages: ChatMessage[] = [];

  if (!messages || messages.length === 0) {
    chatMessages.push({
      role: "user",
      content:
        "[The candidate has joined the interview room. Please introduce yourself and begin the interview.]",
    });
  } else {
    for (const msg of messages) {
      chatMessages.push({ role: msg.role, content: msg.content });
    }
  }

  try {
    const stream = await streamChat({
      systemPrompt,
      messages: chatMessages,
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
