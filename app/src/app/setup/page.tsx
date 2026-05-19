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

const COMPANY_COLORS: Record<Company, string> = {
  meta: 'from-blue-500 to-blue-600',
  google: 'from-emerald-500 to-teal-600',
  amazon: 'from-orange-500 to-amber-600',
}

const COMPANY_GLOW: Record<Company, string> = {
  meta: 'shadow-blue-500/20',
  google: 'shadow-emerald-500/20',
  amazon: 'shadow-orange-500/20',
}

const INTERVIEW_TYPE_ICONS: Record<InterviewType, string> = {
  coding: 'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5',
  behavioral: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155',
  system_design: 'M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z',
  ml_design: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5',
  ai_native_coding: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z',
}

const INTERVIEW_TYPE_DESCRIPTIONS: Record<InterviewType, string> = {
  coding: 'Data structures, algorithms, and problem solving',
  behavioral: 'Leadership, teamwork, and situational questions',
  system_design: 'Distributed systems and architecture',
  ml_design: 'ML system architecture and model design',
  ai_native_coding: 'Coding with AI tools and assistants',
}

const steps = [
  { num: 1, label: 'Company' },
  { num: 2, label: 'Role' },
  { num: 3, label: 'Level' },
  { num: 4, label: 'Type' },
]

export default function SetupPage() {
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [level, setLevel] = useState<Level | null>(null)
  const [interviewType, setInterviewType] = useState<InterviewType | null>(null)
  const [questionMode, setQuestionMode] = useState<QuestionMode>('random')

  const isComplete = company && role && level && interviewType
  const currentStep = !company ? 1 : !role ? 2 : !level ? 3 : !interviewType ? 4 : 5

  function handleStart() {
    if (!isComplete) return
    const params = new URLSearchParams({ company, role, level, type: interviewType, mode: questionMode })
    router.push(`/interview?${params.toString()}`)
  }

  return (
    <div className="bg-grid min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Set Up Your Interview</h1>
          <p className="text-slate-400">Configure your mock interview session.</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep > s.num
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                  : currentStep === s.num
                    ? 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/50'
                    : 'bg-slate-800 text-slate-500'
              }`}>
                {currentStep > s.num ? '✓' : s.num}
              </div>
              <span className={`text-xs hidden sm:block ${currentStep >= s.num ? 'text-slate-300' : 'text-slate-600'}`}>
                {s.label}
              </span>
              {s.num < 4 && <div className={`w-8 h-px ${currentStep > s.num ? 'bg-blue-500/50' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        {/* Company */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Company</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {COMPANIES.map((c) => (
              <button
                key={c}
                onClick={() => { setCompany(c); setLevel(null) }}
                className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 cursor-pointer ${
                  company === c
                    ? `glass gradient-border shadow-lg ${COMPANY_GLOW[c]}`
                    : 'glass hover:bg-slate-800/60 hover:scale-[1.02]'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${COMPANY_COLORS[c]} flex items-center justify-center text-white font-bold text-lg`}>
                  {COMPANY_NAMES[c][0]}
                </div>
                <span className="text-white font-medium">{COMPANY_NAMES[c]}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Role */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Role</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`p-4 rounded-xl transition-all duration-200 text-left cursor-pointer ${
                  role === r
                    ? 'glass gradient-border shadow-lg shadow-blue-500/10'
                    : 'glass hover:bg-slate-800/60 hover:scale-[1.02]'
                }`}
              >
                <span className="text-white font-medium">{ROLE_NAMES[r]}</span>
                <span className="block text-xs text-slate-500 mt-0.5 font-mono">{r.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Level */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Level</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {LEVELS.map((l) => {
              const label = company ? COMPANY_LEVELS[company][l] : l
              return (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`p-4 rounded-xl transition-all duration-200 text-center cursor-pointer ${
                    level === l
                      ? 'glass gradient-border shadow-lg shadow-blue-500/10'
                      : 'glass hover:bg-slate-800/60 hover:scale-[1.02]'
                  }`}
                >
                  <div className="text-white font-semibold font-mono">{label}</div>
                  <div className="text-xs text-slate-500 mt-1 capitalize">{l}</div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Interview Type */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Interview Type</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {INTERVIEW_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setInterviewType(t)}
                className={`p-4 rounded-xl transition-all duration-200 text-left cursor-pointer ${
                  interviewType === t
                    ? 'glass gradient-border shadow-lg shadow-blue-500/10'
                    : 'glass hover:bg-slate-800/60 hover:scale-[1.02]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className={`w-4 h-4 ${interviewType === t ? 'text-blue-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={INTERVIEW_TYPE_ICONS[t]} />
                  </svg>
                  <span className="text-white font-medium">{INTERVIEW_TYPE_NAMES[t]}</span>
                </div>
                <div className="text-xs text-slate-500 ml-6">{INTERVIEW_TYPE_DESCRIPTIONS[t]}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Question Mode */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Question Mode</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setQuestionMode('random')}
              className={`p-4 rounded-xl transition-all duration-200 text-left cursor-pointer ${
                questionMode === 'random'
                  ? 'glass gradient-border shadow-lg shadow-blue-500/10'
                  : 'glass hover:bg-slate-800/60'
              }`}
            >
              <div className="text-white font-medium">Random</div>
              <div className="text-xs text-slate-500 mt-1">Randomly selected from the question bank</div>
            </button>
            <button
              disabled
              className="p-4 rounded-xl glass opacity-40 cursor-not-allowed text-left"
            >
              <div className="text-slate-500 font-medium">
                Focus on Weak Areas
                <span className="ml-2 text-[10px] uppercase tracking-wider bg-slate-700/50 text-slate-500 px-1.5 py-0.5 rounded">Soon</span>
              </div>
              <div className="text-xs text-slate-600 mt-1">AI-powered selection based on past performance</div>
            </button>
          </div>
        </section>

        {/* Start Button */}
        <div className="flex justify-end pt-6 border-t border-slate-800/50">
          <button
            onClick={handleStart}
            disabled={!isComplete}
            className={`group inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-xl transition-all duration-200 ${
              isComplete
                ? 'text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 glow-blue hover:scale-[1.02] cursor-pointer'
                : 'text-slate-600 bg-slate-800/50 cursor-not-allowed'
            }`}
          >
            Start Interview
            <svg className="ml-2 w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
