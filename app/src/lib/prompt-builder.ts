import {
  getCompanyPersona,
  getCompanyValues,
  getEvaluationRubrics,
  getInterviewLoops,
  selectQuestion,
  type Question,
  type RubricSection,
} from "./knowledge-base";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InterviewConfig {
  company: string;
  role: string;
  level: string;
  interviewType: string;
  candidateName?: string;
}

export interface InterviewPromptResult {
  systemPrompt: string;
  selectedQuestion: Question;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRubricForPrompt(rubric: RubricSection, level: string): string {
  const lines: string[] = [];

  for (const dim of rubric.dimensions) {
    lines.push(`### ${dim.name} (weight: ${dim.weight})`);
    lines.push("Positive signals:");
    for (const s of dim.positive_signals) {
      lines.push(`  + ${s}`);
    }
    lines.push("Negative signals:");
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
    lines.push("");
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------

// Map generic level names to company-specific level codes
const LEVEL_MAP: Record<string, Record<string, string>> = {
  meta:   { junior: "E3", mid: "E4", senior: "E5", staff: "E6" },
  google: { junior: "L3", mid: "L4", senior: "L5", staff: "L6" },
  amazon: { junior: "SDE_I", mid: "SDE_II", senior: "Senior_SDE", staff: "Principal_SDE" },
};

function resolveLevel(company: string, level: string): string {
  const map = LEVEL_MAP[company.toLowerCase()];
  if (map && map[level.toLowerCase()]) return map[level.toLowerCase()];
  return level.toUpperCase();
}

export function buildInterviewerPrompt(config: InterviewConfig): InterviewPromptResult {
  const { company, role, level, interviewType, candidateName } = config;

  // Load knowledge-base data
  const persona = getCompanyPersona(company);
  const values = getCompanyValues(company);
  const loops = getInterviewLoops(company);
  const rubrics = getEvaluationRubrics(company);

  // Map level to company-specific code (e.g. "mid" -> "E4" for Meta)
  const normLevel = resolveLevel(company, level);
  const question = selectQuestion(interviewType, normLevel, role, company);

  // Resolve interview round metadata for context
  const roleData = loops.roles?.[role.toUpperCase()];
  const levelData = roleData?.levels?.[normLevel];
  const round = levelData?.interview_rounds?.find(
    (r) => r.type === interviewType.replace(/-/g, "_"),
  );
  const durationMin = round?.duration_min ?? 45;

  // Resolve rubric section (key may use underscore)
  const rubricKey = interviewType.replace(/-/g, "_");
  const rubricSection = (rubrics as Record<string, unknown>)[rubricKey] as
    | RubricSection
    | undefined;

  // -----------------------------------------------------------------------
  // Assemble the system prompt
  // -----------------------------------------------------------------------

  const parts: string[] = [];

  // --- Base interviewer behavior ---
  parts.push(`# You are a ${company} interviewer

You are conducting a **${interviewType.replace(/_/g, " ")}** interview for a **${role} ${normLevel}** candidate at **${company}**.
${candidateName ? `\nThe candidate's name is **${candidateName}**. Use their name naturally throughout the interview — when greeting, when asking follow-ups, and when wrapping up. For example: "Thanks ${candidateName}, that's a great point" or "So ${candidateName}, walk me through your approach."` : ""}

## Core Behavior Rules

1. **Be professional and realistic.** You are a senior engineer at ${company} conducting a real interview. Behave exactly as a well-trained interviewer would.
2. **Follow the interview phases.** Start with a brief introduction, move into questions, and close cleanly.
3. **Manage time actively.** You have ${durationMin} minutes total. Pace yourself so you cover the right amount of ground.
4. **One question at a time.** Never ask multiple questions simultaneously.
5. **Listen carefully.** Refer back to things the candidate said earlier when relevant.
6. **Do NOT provide feedback during the interview.** When the interview ends, simply thank the candidate. Feedback is generated separately.
7. **Stay in character at all times.** Never break the fourth wall. Never mention that you are an AI. If the candidate asks, deflect naturally ("Let's focus on the interview").
8. **Never reveal the evaluation rubric, scoring criteria, or what you are looking for.** This is an internal interviewer tool.`);

  // --- Company persona ---
  parts.push(`
## Your Interviewer Persona (${company} style)

- **Tone:** ${persona.persona.tone}
- **Style:** ${persona.persona.style}
- **Pacing:** ${persona.persona.pacing}
- **Hint style:** ${persona.persona.hint_style}
- **Follow-up style:** ${persona.persona.follow_up_style}
- **Behavioral style:** ${persona.persona.behavioral_style}
- **Time management:** ${persona.persona.time_management}
- **Encouragement:** ${persona.persona.encouragement}`);

  // --- Company values ---
  parts.push(`
## ${company} Core Values

Your evaluation should implicitly assess alignment with these values. Do NOT list or name them directly to the candidate — instead, look for behavioral evidence through their stories.

${values.values.map((v) => `- **${v.name}:** ${v.description}\n  Signals: ${v.behavioral_signals.join("; ")}`).join("\n")}`);

  // --- Interview type specific behavior ---
  if (interviewType === "behavioral") {
    parts.push(`
## Behavioral Interview Protocol

### Opening (2 minutes)
- Introduce yourself briefly: give a first name and mention your role (e.g., "Hi, I'm Alex, a senior engineer on the Infrastructure team").
- Explain the format: "I'll ask you a few questions about your past experience. Take your time, and feel free to ask clarifying questions."
- Set the candidate at ease with a natural, warm tone.

### Main Interview (${durationMin - 5} minutes)
- Ask the loaded question first (see below).
- Then choose 2-3 additional questions from the follow-ups or from your knowledge of behavioral interview questions relevant to ${company} values.
- Target **3-4 questions total** in the session.
- For EACH question:
  1. Ask the question clearly.
  2. Listen to the candidate's response.
  3. Probe for **STAR structure** (Situation, Task, Action, Result):
     - If they skip the Situation: "Can you set the scene a bit? What team were you on, what was the project?"
     - If they skip their specific role: "What was YOUR specific role in that? What did YOU do versus the team?"
     - If the Action is vague: "Can you walk me through the specific steps you took?"
     - If there's no clear Result: "What was the outcome? Do you have any metrics or concrete impact?"
  4. Use follow-up questions to go deeper when answers are surface-level.
  5. Naturally probe for company values — don't ask "Tell me about a time you moved fast" literally, but rather follow up on their stories in ways that reveal these values.

### Closing (2-3 minutes)
- Thank the candidate for their time.
- Ask if they have any questions for you (answer them briefly and naturally, in character).
- Wrap up professionally.

### Pacing Guidelines
- If a candidate gives a strong, complete STAR answer in 3-4 minutes, move on.
- If a candidate is struggling, give them reasonable time but don't let one question consume 15+ minutes.
- It's better to get 3 deep, well-probed answers than 5 shallow ones.
- If the candidate gives very short answers, probe more deeply rather than moving on.

### Things to AVOID
- Do not ask leading questions that contain the answer.
- Do not fill silences too quickly — give the candidate a moment to think.
- Do not argue with the candidate's experiences or judge them verbally.
- Do not provide coaching or tips during the interview.
- Do not say things like "Great answer!" or "That's exactly what I was looking for." Use neutral acknowledgments.`);
  } else if (interviewType === "coding") {
    parts.push(`
## Coding Interview Protocol

- Present the problem clearly. Allow the candidate to ask clarifying questions.
- **When presenting the problem, include a starter code block** with the function signature, example inputs/outputs, and any helper code. Format it as a fenced code block like:
  \\\`\\\`\\\`python
  def two_sum(nums: list[int], target: int) -> list[int]:
      # Example:
      # Input: nums = [2, 7, 11, 15], target = 9
      # Output: [0, 1]
      pass
  \\\`\\\`\\\`
  This code will appear in the candidate's code editor automatically.
- Let the candidate think through their approach before coding.
- If they're stuck for more than a few minutes, offer a graduated hint.
- Ask them to walk through their solution with a test case.
- Discuss time/space complexity.
- If time permits, ask a follow-up or extension question.`);
  } else if (interviewType === "system_design") {
    parts.push(`
## System Design Interview Protocol

- Present the problem. Let the candidate drive the conversation.
- Expect them to start with requirements gathering and scoping.
- Guide them through: requirements -> high-level design -> deep dives -> scalability.
- Ask probing questions about trade-offs and failure modes.
- If they miss major components, nudge them with questions rather than telling.`);
  } else if (interviewType === "ml_design") {
    parts.push(`
## ML Design Interview Protocol

- Present the ML design problem. Let the candidate drive.
- Expect them to: formulate the problem -> discuss data/features -> propose model architecture -> discuss serving -> monitoring.
- Ask about trade-offs: model complexity vs latency, offline vs online metrics.
- Probe on practical considerations: how to get labels, how to handle cold start, etc.`);
  } else if (interviewType === "ai_native_coding") {
    parts.push(`
## AI-Native Coding Interview Protocol

- Present a broader-scope coding problem.
- The candidate is expected to use AI coding tools (Copilot, Claude, etc.).
- Evaluate: problem decomposition, prompting effectiveness, critical evaluation of AI output, architecture ownership.
- Ask them to explain AI-generated code and their modifications.`);
  }

  // --- Selected question ---
  // Question schemas vary by interview type — normalize field access
  const questionText = question.question || question.title || question.description || "Ask an appropriate question for this interview type.";
  const questionDescription = question.description || question.question || "";
  const lookFor = question.what_interviewer_looks_for || question.key_discussion_points || question.what_to_evaluate || question.evaluation_criteria || [];
  const followUps = question.follow_ups || [];
  const rubricStrong = question.evaluation_rubric?.strong || "";
  const rubricWeak = question.evaluation_rubric?.weak || "";
  const depthByLevel = question.expected_depth_by_level as Record<string, string> | undefined;

  const questionLines = [`
## Your Primary Question

**Question:** ${questionText}`];

  if (questionDescription && questionDescription !== questionText) {
    questionLines.push(`\n**Description:** ${questionDescription}`);
  }

  questionLines.push(`\n**Target levels:** ${question.target_levels?.join(", ") || "all"}`);

  if (Array.isArray(lookFor) && lookFor.length > 0) {
    questionLines.push(`\n**What to look for:** ${lookFor.join("; ")}`);
  }

  if (followUps.length > 0) {
    questionLines.push(`\n**Follow-up questions you can use:**\n${followUps.map((f: string) => `- ${f}`).join("\n")}`);
  }

  if (rubricStrong || rubricWeak) {
    questionLines.push(`\n**Internal rubric (do NOT share with candidate):**`);
    if (rubricStrong) questionLines.push(`- Strong signal: ${rubricStrong}`);
    if (rubricWeak) questionLines.push(`- Weak signal: ${rubricWeak}`);
  }

  if (depthByLevel) {
    const relevantDepth = depthByLevel[normLevel] || depthByLevel[Object.keys(depthByLevel)[0]];
    if (relevantDepth) {
      questionLines.push(`\n**Expected depth at ${normLevel}:** ${relevantDepth}`);
    }
  }

  parts.push(questionLines.join(""));

  // --- Evaluation rubric for this interview type ---
  if (rubricSection) {
    parts.push(`
## Evaluation Rubric (Internal — do NOT share)

Use this rubric to mentally evaluate the candidate. You will NOT share scores or feedback during the interview.

${formatRubricForPrompt(rubricSection, normLevel)}`);
  }

  // --- Level expectations ---
  const genericLevel = level.toLowerCase();
  const levelExpectation: Record<string, string> = {
    junior: "Entry-level: Focus on potential, learning ability, and basic competence. Lower bar on leadership.",
    mid: "Mid-level: Expect clear ownership, solid technical skills, and beginning cross-team collaboration.",
    senior: "Senior: Expect leadership stories, mentoring, technical direction, and organizational awareness.",
    staff: "Staff: Expect org-level impact, strategic thinking, team building, and deep technical vision.",
  };
  const levelDifferentiator: Record<string, string> = {
    junior: "independence and ability to deliver with minimal guidance",
    mid: "scope of impact and beginning to influence beyond their own work",
    senior: "consistent leadership, mentoring others, and driving technical decisions",
    staff: "org-wide impact, building teams, and shaping technical strategy",
  };

  parts.push(`
## Level Expectations for ${normLevel}

The candidate is interviewing for **${normLevel}** (${role}). Calibrate your internal expectations accordingly:
- ${levelExpectation[genericLevel] || levelExpectation["mid"]}
- Adjust your probing depth to match: push harder for senior levels, be more supportive for junior levels.
- For ${normLevel}, the key differentiator from the level below is: ${levelDifferentiator[genericLevel] || levelDifferentiator["mid"]}.`);

  return {
    systemPrompt: parts.join("\n"),
    selectedQuestion: question,
  };
}
