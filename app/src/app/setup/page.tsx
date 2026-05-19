'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  type Company,
  type Role,
  type Level,
  type InterviewType,
  type QuestionMode,
  COMPANY_LEVELS,
  COMPANY_NAMES,
  ROLE_NAMES,
  INTERVIEW_TYPE_NAMES,
} from '@/types/interview'

const COMPANIES: Company[] = ['meta', 'google', 'amazon']
const ROLES: Role[] = ['swe', 'mle', 'de']
const LEVELS: Level[] = ['junior', 'mid', 'senior', 'staff']
const INTERVIEW_TYPES: InterviewType[] = [
  'coding',
  'behavioral',
  'system_design',
  'ml_design',
  'ai_native_coding',
]

const COMPANY_ICONS: Record<Company, string> = {
  meta: 'M',
  google: 'G',
  amazon: 'A',
}

const COMPANY_COLORS: Record<Company, string> = {
  meta: 'bg-blue-600',
  google: 'bg-red-500',
  amazon: 'bg-orange-500',
}

const INTERVIEW_TYPE_DESCRIPTIONS: Record<InterviewType, string> = {
  coding: 'Data structures, algorithms, and problem solving',
  behavioral: 'Leadership, teamwork, and situational questions',
  system_design: 'Distributed systems and architecture',
  ml_design: 'ML system architecture and model design',
  ai_native_coding: 'Coding with AI tools and assistants',
}

export default function SetupPage() {
  const router = useRouter()

  const [company, setCompany] = useState<Company | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [level, setLevel] = useState<Level | null>(null)
  const [interviewType, setInterviewType] = useState<InterviewType | null>(null)
  const [questionMode, setQuestionMode] = useState<QuestionMode>('random')

  const isComplete = company && role && level && interviewType

  function handleStart() {
    if (!isComplete) return
    const params = new URLSearchParams({
      company,
      role,
      level,
      type: interviewType,
      mode: questionMode,
    })
    router.push(`/interview?${params.toString()}`)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">
          Set Up Your Interview
        </h1>
        <p className="text-gray-400">
          Choose your target company, role, level, and interview type.
        </p>
      </div>

      {/* Company Selector */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Company
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {COMPANIES.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCompany(c)
                setLevel(null) // reset level when company changes
              }}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                company === c
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-600'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg ${COMPANY_COLORS[c]} flex items-center justify-center text-white font-bold text-lg`}
              >
                {COMPANY_ICONS[c]}
              </div>
              <span className="text-white font-medium">
                {COMPANY_NAMES[c]}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Role Selector */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Role
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                role === r
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-600'
              }`}
            >
              <span className="text-white font-medium">{ROLE_NAMES[r]}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Level Selector */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Level
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {LEVELS.map((l) => {
            const label = company ? COMPANY_LEVELS[company][l] : l
            return (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`p-4 rounded-xl border-2 transition-all text-center cursor-pointer ${
                  level === l
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                }`}
              >
                <div className="text-white font-medium">{label}</div>
                <div className="text-xs text-gray-500 mt-1 capitalize">{l}</div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Interview Type Selector */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Interview Type
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {INTERVIEW_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setInterviewType(t)}
              className={`p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                interviewType === t
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-600'
              }`}
            >
              <div className="text-white font-medium">
                {INTERVIEW_TYPE_NAMES[t]}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {INTERVIEW_TYPE_DESCRIPTIONS[t]}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Question Mode */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Question Mode
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setQuestionMode('random')}
            className={`p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
              questionMode === 'random'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-gray-900 hover:border-gray-600'
            }`}
          >
            <div className="text-white font-medium">Random</div>
            <div className="text-xs text-gray-500 mt-1">
              Randomly selected questions from the question bank
            </div>
          </button>
          <button
            disabled
            className="p-4 rounded-xl border-2 border-gray-800 bg-gray-900/50 text-left opacity-50 cursor-not-allowed"
          >
            <div className="text-gray-500 font-medium">
              Focus on Weak Areas
              <span className="ml-2 text-[10px] uppercase tracking-wider bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
                Coming Soon
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              AI-powered selection based on your past performance
            </div>
          </button>
        </div>
      </section>

      {/* Start Button */}
      <div className="flex justify-end pt-4 border-t border-gray-800">
        <button
          onClick={handleStart}
          disabled={!isComplete}
          className={`inline-flex items-center justify-center px-8 py-3.5 text-base font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-950 ${
            isComplete
              ? 'text-white bg-blue-600 hover:bg-blue-500 cursor-pointer'
              : 'text-gray-500 bg-gray-800 cursor-not-allowed'
          }`}
        >
          Start Interview
          <svg
            className="ml-2 w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
