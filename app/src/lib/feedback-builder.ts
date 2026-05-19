import {
  getCompanyValues,
  getEvaluationRubrics,
  type RubricSection,
} from "./knowledge-base";
import type { InterviewConfig } from "./prompt-builder";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TranscriptMessage {
  role: "user" | "assistant";
  content: string;
}

export interface FeedbackDimension {
  name: string;
  score: number;
  evidence: string[];
}

export interface FeedbackSignal {
  quote: string;
  signal: string;
  dimension: string;
}

export interface FeedbackResponse {
  overallScore: number;
  levelAssessment: string;
  dimensions: FeedbackDimension[];
  positiveSignals: FeedbackSignal[];
  negativeSignals: FeedbackSignal[];
  improvements: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTranscript(transcript: TranscriptMessage[]): string {
  return transcript
    .map((m) => {
      const label = m.role === "assistant" ? "Interviewer" : "Candidate";
      return `**${label}:** ${m.content}`;
    })
    .join("\n\n");
}

function formatRubricForFeedback(rubric: RubricSection, level: string): string {
  const lines: string[] = [];

  for (const dim of rubric.dimensions) {
    lines.push(`### ${dim.name} (weight: ${dim.weight})`);
    lines.push("Positive signals to look for:");
    for (const s of dim.positive_signals) {
      lines.push(`  + ${s}`);
    }
    lines.push("Negative signals to watch for:");
    for (const s of dim.negative_signals) {
      lines.push(`  - ${s}`);
    }
    lines.push("");
  }

  const normLevel = level.toUpperCase();
  const cal = rubric.level_calibration[normLevel];
  if (cal) {
    lines.push(`### Level Calibration for ${normLevel}`);
    lines.push(cal);
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Feedback prompt builder
// ---------------------------------------------------------------------------

export function buildFeedbackPrompt(
  config: InterviewConfig,
  transcript: TranscriptMessage[],
): string {
  const { company, role, level, interviewType } = config;
  const rubrics = getEvaluationRubrics();
  const values = getCompanyValues(company);

  const rubricKey = interviewType.replace(/-/g, "_");
  const rubric = (rubrics as Record<string, unknown>)[rubricKey] as
    | RubricSection
    | undefined;

  const normLevel = level.toUpperCase();

  const parts: string[] = [];

  parts.push(`# Interview Feedback Analysis

You are an expert interview evaluator at ${company}. You have just observed a **${interviewType.replace(/_/g, " ")}** interview for a **${role} ${normLevel}** candidate.

Your task is to produce a thorough, evidence-based evaluation of the candidate's performance.`);

  // --- Company values context ---
  parts.push(`
## ${company} Core Values

Evaluate the candidate's alignment with these values:
${values.values.map((v) => `- **${v.name}:** ${v.description}`).join("\n")}`);

  // --- Rubric ---
  if (rubric) {
    parts.push(`
## Evaluation Rubric

${formatRubricForFeedback(rubric, level)}`);
  }

  // --- Level expectations ---
  parts.push(`
## Level Expectations

The candidate is interviewing for **${normLevel}**. Calibrate your evaluation accordingly:
${rubric?.level_calibration[normLevel] ? `- ${rubric.level_calibration[normLevel]}` : `- Evaluate at the ${normLevel} bar.`}`);

  // --- Transcript ---
  parts.push(`
## Full Interview Transcript

${formatTranscript(transcript)}`);

  // --- Instructions ---
  parts.push(`
## Your Task

Analyze the transcript above against the rubric and produce a structured evaluation. Be specific — cite exact quotes from the candidate's responses as evidence.

Return your response as a JSON object with exactly this structure:

\`\`\`json
{
  "overallScore": <number 0-100>,
  "levelAssessment": "<string: one of 'Below ${normLevel}', 'Meets ${normLevel}', 'Exceeds ${normLevel}', or 'Strong ${normLevel}' — with a 1-2 sentence explanation>",
  "dimensions": [
    {
      "name": "<dimension name from rubric>",
      "score": <number 0-100>,
      "evidence": ["<specific observation from transcript>", ...]
    }
  ],
  "positiveSignals": [
    {
      "quote": "<exact or near-exact quote from the candidate>",
      "signal": "<what this demonstrates>",
      "dimension": "<which rubric dimension this maps to>"
    }
  ],
  "negativeSignals": [
    {
      "quote": "<exact or near-exact quote from the candidate, or description of what was missing>",
      "signal": "<what this indicates>",
      "dimension": "<which rubric dimension this maps to>"
    }
  ],
  "improvements": [
    "<specific, actionable improvement suggestion #1>",
    "<specific, actionable improvement suggestion #2>",
    "<specific, actionable improvement suggestion #3>"
  ]
}
\`\`\`

Important guidelines:
- Score each dimension independently from 0 to 100.
- The overall score should be a weighted average reflecting the dimension weights.
- For positive/negative signals, always include an actual quote or describe a specific moment.
- Level assessment should compare the candidate's performance to what is expected at ${normLevel}.
- Improvements should be specific and actionable — not generic advice like "practice more."
- Return ONLY the JSON object, no other text before or after it.`);

  return parts.join("\n");
}
