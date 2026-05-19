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

export function getEvaluationRubrics(): EvaluationRubrics {
  return loadJson<EvaluationRubrics>(
    path.join(KNOWLEDGE_BASE_ROOT, "evaluation_rubrics.json"),
  );
}

export function getQuestions(interviewType: string): QuestionsFile {
  return loadJson<QuestionsFile>(questionsPath(interviewType));
}

// ---------------------------------------------------------------------------
// Question selector
// ---------------------------------------------------------------------------

/**
 * Select a random question that is appropriate for the given level and role.
 *
 * Filtering rules:
 *   1. If the question has `target_levels`, it must include the requested level.
 *   2. If the question has `target_roles`, it must include the requested role.
 *   3. Otherwise the question is considered a wildcard and always eligible.
 *
 * Falls back to a random question from the full pool if no filtered match.
 */
export function selectQuestion(
  interviewType: string,
  level: string,
  _role: string,
): Question {
  const file = getQuestions(interviewType);
  const questions = file.questions;

  // Normalise level to upper-case (e.g. "e4" -> "E4")
  const normLevel = level.toUpperCase();

  const eligible = questions.filter((q) => {
    if (q.target_levels && q.target_levels.length > 0) {
      return q.target_levels.includes(normLevel);
    }
    return true;
  });

  const pool = eligible.length > 0 ? eligible : questions;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}
