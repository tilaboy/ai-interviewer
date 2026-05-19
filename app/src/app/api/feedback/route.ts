import {
  buildFeedbackPrompt,
  type TranscriptMessage,
  type FeedbackResponse,
} from "@/lib/feedback-builder";
import { generateText } from "@/lib/ai-client";
import type { InterviewConfig } from "@/lib/prompt-builder";

interface FeedbackRequestBody {
  transcript: TranscriptMessage[];
  config: InterviewConfig;
}

export async function POST(request: Request) {
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

  try {
    const rawText = await generateText(feedbackPrompt, "thorough");

    // Parse JSON from the response (strip markdown code fences if present)
    let jsonText = rawText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "");
      jsonText = jsonText.replace(/\n?\s*```\s*$/, "");
    }

    let feedback: FeedbackResponse;
    try {
      feedback = JSON.parse(jsonText) as FeedbackResponse;
    } catch {
      return Response.json(
        { error: "Failed to parse feedback JSON from AI", raw: rawText },
        { status: 502 },
      );
    }

    if (
      typeof feedback.overallScore !== "number" ||
      typeof feedback.levelAssessment !== "string" ||
      !Array.isArray(feedback.dimensions) ||
      !Array.isArray(feedback.positiveSignals) ||
      !Array.isArray(feedback.negativeSignals) ||
      !Array.isArray(feedback.improvements)
    ) {
      return Response.json(
        { error: "Feedback response has unexpected shape", raw: feedback },
        { status: 502 },
      );
    }

    return Response.json(feedback);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: `AI provider error: ${message}` },
      { status: 502 },
    );
  }
}
