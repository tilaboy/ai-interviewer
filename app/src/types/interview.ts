export type Company = 'meta' | 'google' | 'amazon'
export type Role = 'swe' | 'mle' | 'de'
export type Level = 'junior' | 'mid' | 'senior' | 'staff'
export type InterviewType = 'coding' | 'behavioral' | 'system_design' | 'ml_design' | 'ai_native_coding'
export type QuestionMode = 'random' | 'weak_areas'

export interface InterviewConfig {
  company: Company
  role: Role
  level: Level
  interviewType: InterviewType
  questionMode: QuestionMode
}

export const COMPANY_LEVELS: Record<Company, Record<Level, string>> = {
  meta: { junior: 'E3', mid: 'E4', senior: 'E5', staff: 'E6' },
  google: { junior: 'L3', mid: 'L4', senior: 'L5', staff: 'L6' },
  amazon: { junior: 'SDE I', mid: 'SDE II', senior: 'Senior SDE', staff: 'Principal SDE' },
}

export const COMPANY_NAMES: Record<Company, string> = {
  meta: 'Meta',
  google: 'Google',
  amazon: 'Amazon',
}

export const ROLE_NAMES: Record<Role, string> = {
  swe: 'Software Engineer',
  mle: 'ML Engineer',
  de: 'Data Engineer',
}

export const INTERVIEW_TYPE_NAMES: Record<InterviewType, string> = {
  coding: 'Coding',
  behavioral: 'Behavioral',
  system_design: 'System Design',
  ml_design: 'ML Design',
  ai_native_coding: 'AI-Native Coding',
}
