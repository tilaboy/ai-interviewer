import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";

export type AIProvider = "gemini" | "claude";

interface ChatOptions {
  systemPrompt: string;
  messages: { role: "user" | "assistant"; content: string }[];
  stream?: boolean;
}

function getProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase();
  if (provider === "claude" && process.env.ANTHROPIC_API_KEY) return "claude";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  throw new Error(
    "No AI provider configured. Set GEMINI_API_KEY or ANTHROPIC_API_KEY in .env.local"
  );
}

function getGeminiModel(tier: "fast" | "thorough" = "fast"): string {
  return process.env.GEMINI_MODEL || (tier === "thorough" ? "gemini-2.5-flash" : "gemini-2.5-flash");
}

function getClaudeModel(tier: "fast" | "thorough" = "fast"): string {
  return tier === "thorough" ? "claude-opus-4-6-20250514" : "claude-sonnet-4-6-20250514";
}

// ---------------------------------------------------------------------------
// Streaming chat (for interview conversation)
// ---------------------------------------------------------------------------

export async function streamChat(options: ChatOptions): Promise<ReadableStream<Uint8Array>> {
  const provider = getProvider();

  if (provider === "gemini") {
    return streamGemini(options);
  }
  return streamClaude(options);
}

async function streamGemini(options: ChatOptions): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: getGeminiModel("fast"),
    systemInstruction: options.systemPrompt,
  });

  // Convert messages to Gemini format.
  // Gemini requires history to start with a "user" message.
  // If the conversation starts with a model (interviewer) message,
  // prepend the synthetic user message that initiated it.
  const allMessages = options.messages.map((m) => ({
    role: m.role === "assistant" ? "model" as const : "user" as const,
    parts: [{ text: m.content }],
  }));

  // Ensure first message is user role
  if (allMessages.length > 0 && allMessages[0].role === "model") {
    allMessages.unshift({
      role: "user" as const,
      parts: [{ text: "[Interview session started]" }],
    });
  }

  // Gemini also requires alternating user/model turns — merge consecutive same-role messages
  const merged: typeof allMessages = [];
  for (const msg of allMessages) {
    if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
      merged[merged.length - 1].parts[0].text += "\n\n" + msg.parts[0].text;
    } else {
      merged.push({ ...msg, parts: [{ text: msg.parts[0].text }] });
    }
  }

  const history = merged.slice(0, -1);
  const lastMessage = merged[merged.length - 1];

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(lastMessage.parts[0].text);

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

async function streamClaude(options: ChatOptions): Promise<ReadableStream<Uint8Array>> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const stream = await client.messages.create({
    model: getClaudeModel("fast"),
    max_tokens: 1024,
    system: options.systemPrompt,
    messages: options.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    stream: true,
  });

  const encoder = new TextEncoder();
  return new ReadableStream({
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
}

// ---------------------------------------------------------------------------
// Non-streaming chat (for feedback generation)
// ---------------------------------------------------------------------------

export async function generateText(
  prompt: string,
  tier: "fast" | "thorough" = "thorough"
): Promise<string> {
  const provider = getProvider();

  if (provider === "gemini") {
    return generateGemini(prompt, tier);
  }
  return generateClaude(prompt, tier);
}

async function generateGemini(prompt: string, tier: "fast" | "thorough"): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: getGeminiModel(tier),
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function generateClaude(prompt: string, tier: "fast" | "thorough"): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const response = await client.messages.create({
    model: getClaudeModel(tier),
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }
  return textBlock.text;
}
