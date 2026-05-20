import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

const KNOWLEDGE_BASE_ROOT = path.join(process.cwd(), "..", "knowledge_base");

function companyPath(company: string, file: string): string {
  return path.join(KNOWLEDGE_BASE_ROOT, "companies", company.toLowerCase(), file);
}

function questionsPath(interviewType: string): string {
  // Map interview type names to directory/file names in the knowledge base.
  const dirName = interviewType.replace(/-/g, "_");
  return path.join(
    KNOWLEDGE_BASE_ROOT,
    "questions",
    dirName,
    `${dirName}_questions.json`,
  );
}

// ---------------------------------------------------------------------------
// Generic JSON loader (with caching for the lifetime of the process)
// ---------------------------------------------------------------------------

const cache = new Map<string, unknown>();

function loadJson<T>(filePath: string): T {
  const cached = cache.get(filePath);
  if (cached) return cached as T;

  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as T;
  cache.set(filePath, parsed);
  return parsed;
}

// ---------------------------------------------------------------------------
// Public type definitions
// ---------------------------------------------------------------------------

export interface InterviewerPersona {
  company: string;
  persona: {
    tone: string;
    style: string;
    pacing: string;
    hint_style: string;
    follow_up_style: string;
    behavioral_style: string;
    time_management: string;
    encouragement: string;
  };
}

export interface CompanyValues {
  company: string;
  values: {
    name: string;
    description: string;
    behavioral_signals: string[];
  }[];
}

export interface InterviewRound {
  type: string;
  count: number;
  duration_min: number;
  description: string;
  focus_areas: string[];
}

export interface InterviewLoops {
  [key: string]: unknown;
  roles: Record<
    string,
    {
      title: string;
      levels: Record<
        string,
        {
          title?: string;
          interview_rounds: InterviewRound[];
          notes?: string;
        }
      >;
    }
  >;
}

export interface RubricDimension {
  name: string;
  weight: string;
  positive_signals: string[];
  negative_signals: string[];
}

export interface RubricSection {
  dimensions: RubricDimension[];
  level_calibration: Record<string, string>;
}

export interface EvaluationRubrics {
  meta: { description: string; last_updated: string };
  coding: RubricSection;
  behavioral: RubricSection;
  system_design: RubricSection;
  ml_design: RubricSection;
  ai_native_coding: RubricSection;
  [key: string]: unknown;
}

export interface Question {
  id: string;
  category: string;
  target_levels: string[];
  question: string;
  what_interviewer_looks_for: string[];
  follow_ups: string[];
  evaluation_rubric: { strong: string; weak: string };
  // Some question types have extra fields (difficulty, starter_code, etc.)
  [key: string]: unknown;
}

export interface QuestionsFile {
  meta: { description: string; [key: string]: unknown };
  questions: Question[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Public loaders
// ---------------------------------------------------------------------------

export function getCompanyPersona(company: string): InterviewerPersona {
  return loadJson<InterviewerPersona>(companyPath(company, "interviewer_persona.json"));
}

export function getCompanyValues(company: string): CompanyValues {
  return loadJson<CompanyValues>(companyPath(company, "company_values.json"));
}

export function getInterviewLoops(company: string): InterviewLoops {
  return loadJson<InterviewLoops>(companyPath(company, "interview_loops.json"));
}

export function getEvaluationRubrics(company?: string): EvaluationRubrics {
  // Try company-specific rubrics first, fall back to top-level
  if (company) {
    const companyRubricPath = companyPath(company, "evaluation_rubrics.json");
    try {
      return loadJson<EvaluationRubrics>(companyRubricPath);
    } catch { /* fall through to default */ }
  }
  return loadJson<EvaluationRubrics>(
    path.join(KNOWLEDGE_BASE_ROOT, "evaluation_rubrics.json"),
  );
}

export function getQuestions(interviewType: string): QuestionsFile {
  return loadJson<QuestionsFile>(questionsPath(interviewType));
}

/**
 * Load all question files for a given interview type, including
 * company-specific and role-specific supplements.
 */
function getAllQuestions(
  interviewType: string,
  company: string,
  role: string,
): Question[] {
  const baseFile = getQuestions(interviewType);
  const questions = [...baseFile.questions];

  // Load company-specific behavioral questions
  if (interviewType === "behavioral") {
    const companyFiles: Record<string, string> = {
      google: "google_behavioral.json",
      amazon: "amazon_lp_questions.json",
    };
    const extra = companyFiles[company.toLowerCase()];
    if (extra) {
      const extraPath = path.join(
        KNOWLEDGE_BASE_ROOT, "questions", "behavioral", extra,
      );
      try {
        const extraFile = loadJson<QuestionsFile>(extraPath);
        questions.push(...extraFile.questions);
      } catch { /* file may not exist */ }
    }
  }

  // Load SQL questions for DE coding interviews
  if (interviewType === "coding" && role.toLowerCase() === "de") {
    const sqlPath = path.join(
      KNOWLEDGE_BASE_ROOT, "questions", "coding", "sql_questions.json",
    );
    try {
      const sqlFile = loadJson<QuestionsFile>(sqlPath);
      questions.push(...sqlFile.questions);
    } catch { /* file may not exist */ }
  }

  // Load company-specific system design questions
  if (interviewType === "system_design") {
    const companyFiles: Record<string, string> = {
      google: "google_system_design.json",
      amazon: "amazon_system_design.json",
    };
    const extra = companyFiles[company.toLowerCase()];
    if (extra) {
      const extraPath = path.join(
        KNOWLEDGE_BASE_ROOT, "questions", "system_design", extra,
      );
      try {
        const extraFile = loadJson<QuestionsFile>(extraPath);
        questions.push(...extraFile.questions);
      } catch { /* file may not exist */ }
    }
  }

  // Load advanced ML design questions
  if (interviewType === "ml_design") {
    const advancedPath = path.join(
      KNOWLEDGE_BASE_ROOT, "questions", "ml_design", "advanced_ml_design.json",
    );
    try {
      const advancedFile = loadJson<QuestionsFile>(advancedPath);
      questions.push(...advancedFile.questions);
    } catch { /* file may not exist */ }
  }

  return questions;
}

// ---------------------------------------------------------------------------
// Question selector
// ---------------------------------------------------------------------------

/**
 * Select a random question appropriate for the given level, role, and company.
 *
 * Filtering:
 *   1. Loads base + company-specific + role-specific question pools.
 *   2. Filters by target_levels if present.
 *   3. Filters by target_roles if present.
 *   4. Falls back to the full pool if no filtered match.
 */
/**
 * Select the demo question for a given interview type (guest trial flow).
 */
export function selectDemoQuestion(interviewType: string): Question {
  const demoPath = path.join(KNOWLEDGE_BASE_ROOT, "questions", "demo", "demo_questions.json");
  const demoFile = loadJson<QuestionsFile>(demoPath);
  const match = demoFile.questions.find(
    (q) => (q.type as string) === interviewType || q.category === interviewType
  );
  return match || demoFile.questions[0];
}

export function selectQuestion(
  interviewType: string,
  level: string,
  role: string,
  company?: string,
  mode?: string,
): Question {
  if (mode === "demo") {
    return selectDemoQuestion(interviewType);
  }

  const questions = getAllQuestions(interviewType, company ?? "meta", role);

  const normLevel = level.toUpperCase();
  const normRole = role.toUpperCase();

  const eligible = questions.filter((q) => {
    const levelOk = !q.target_levels || q.target_levels.length === 0 ||
      q.target_levels.includes(normLevel);
    const roleOk = !q.target_roles || (q.target_roles as string[]).length === 0 ||
      (q.target_roles as string[]).some(r => r.toUpperCase() === normRole);
    return levelOk && roleOk;
  });

  const pool = eligible.length > 0 ? eligible : questions;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}
