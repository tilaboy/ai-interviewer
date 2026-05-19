import Anthropic from "@anthropic-ai/sdk";
import {
  buildFeedbackPrompt,
  type TranscriptMessage,
  type FeedbackResponse,
} from "@/lib/feedback-builder";
import type { InterviewConfig } from "@/lib/prompt-builder";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeedbackRequestBody {
  transcript: TranscriptMessage[];
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
  let body: FeedbackRequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  const { transcript, config } = body;

  if (!config?.company || !config?.role || !config?.level || !config?.interviewType) {
    return Response.json(
      { error: "Missing required config fields: company, role, level, interviewType" },
      { status: 400 },
    );
  }

  if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
    return Response.json(
      { error: "Transcript must be a non-empty array of messages" },
      { status: 400 },
    );
  }

  // --- Build feedback prompt ---
  let feedbackPrompt: string;
  try {
    feedbackPrompt = buildFeedbackPrompt(config, transcript);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: `Failed to build feedback prompt: ${message}` },
      { status: 500 },
    );
  }

  // --- Call Claude (non-streaming, structured JSON response) ---
  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-6-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: feedbackPrompt,
        },
      ],
    });

    // Extract text content from Claude's response
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return Response.json(
        { error: "No text response from Claude" },
        { status: 502 },
      );
    }

    // Parse the JSON from Claude's response
    // Claude may wrap the JSON in markdown code fences; strip them if present.
    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith("```")) {
      // Remove opening fence (```json or ```)
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "");
      // Remove closing fence
      jsonText = jsonText.replace(/\n?\s*```\s*$/, "");
    }

    let feedback: FeedbackResponse;
    try {
      feedback = JSON.parse(jsonText) as FeedbackResponse;
    } catch {
      return Response.json(
        {
          error: "Failed to parse feedback JSON from Claude",
          raw: textBlock.text,
        },
        { status: 502 },
      );
    }

    // Basic validation of the response shape
    if (
      typeof feedback.overallScore !== "number" ||
      typeof feedback.levelAssessment !== "string" ||
      !Array.isArray(feedback.dimensions) ||
      !Array.isArray(feedback.positiveSignals) ||
      !Array.isArray(feedback.negativeSignals) ||
      !Array.isArray(feedback.improvements)
    ) {
      return Response.json(
        {
          error: "Feedback response has unexpected shape",
          raw: feedback,
        },
        { status: 502 },
      );
    }

    return Response.json(feedback);
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
