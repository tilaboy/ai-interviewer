'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const features = [
  {
    icon: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
    title: 'Company-Specific',
    desc: 'Tailored to Meta, Google, and Amazon — each with unique interviewer personas, values, and rubrics.',
  },
  {
    icon: 'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5',
    title: '5 Interview Types',
    desc: 'Coding, behavioral, system design, ML design, and AI-native coding with real tools.',
  },
  {
    icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
    title: 'Signal-Level Feedback',
    desc: 'Detailed scoring with highlighted positive and negative signals, plus actionable improvements.',
  },
]

const trialOptions = [
  {
    type: 'coding',
    icon: 'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5',
    title: 'Coding Interview',
    desc: 'Solve an algorithm problem with an AI interviewer guiding you',
    time: '~20 min',
  },
  {
    type: 'system_design',
    icon: 'M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z',
    title: 'System Design',
    desc: 'Design a distributed system with whiteboard and discussion',
    time: '~30 min',
  },
  {
    type: 'behavioral',
    icon: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155',
    title: 'Behavioral',
    desc: 'Practice telling your story with STAR-format coaching',
    time: '~15 min',
  },
]

export default function Home() {
  const [name, setName] = useState('')
  const [step, setStep] = useState<'name' | 'choose'>('name')
  const router = useRouter()

  const handleNameSubmit = () => {
    if (!name.trim()) return
    setStep('choose')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) handleNameSubmit()
  }

  const handleTrial = (type: string) => {
    const params = new URLSearchParams({
      company: 'meta',
      role: 'swe',
      level: 'mid',
      type,
      mode: 'demo',
      name: name.trim(),
    })
    router.push(`/interview?${params.toString()}`)
  }

  return (
    <div className="bg-grid min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col items-center justify-center px-4 pt-16 pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-surface text-xs text-slate-300 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Powered by AI &middot; Free to try
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="text-white">Master Your</span>
            <br />
            <span className="text-gradient">Tech Interview</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 mb-12 max-w-xl mx-auto leading-relaxed">
            Practice with an AI interviewer that knows exactly what
            Meta, Google, and Amazon are looking for at every level.
          </p>

          {/* Step 1: Name input */}
          {step === 'name' && (
            <div className="max-w-md mx-auto">
              <div className="glass-elevated rounded-2xl p-2 flex items-center gap-2 light-edge">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What's your first name?"
                  className="flex-1 bg-transparent px-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleNameSubmit}
                  disabled={!name.trim()}
                  className={`group flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    name.trim()
                      ? 'text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 glow-blue hover:scale-[1.02] cursor-pointer'
                      : 'text-slate-600 bg-slate-800/30 cursor-not-allowed'
                  }`}
                >
                  Next
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Choose interview type */}
          {step === 'choose' && (
            <div className="max-w-2xl mx-auto">
              <p className="text-slate-300 mb-6">
                Hey <span className="text-white font-semibold">{name}</span>, pick an interview to try:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {trialOptions.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => handleTrial(opt.type)}
                    className="glass rounded-2xl p-6 light-edge text-left hover:glass-elevated hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl glass-surface flex items-center justify-center mb-4 group-hover:glow-active transition-all">
                      <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={opt.icon} />
                      </svg>
                    </div>
                    <div className="text-sm font-semibold text-white mb-1">{opt.title}</div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">{opt.desc}</p>
                    <span className="text-xs text-slate-500 font-mono">{opt.time}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-center gap-4">
                <span className="text-xs text-slate-600">or</span>
                <Link
                  href={`/setup?name=${encodeURIComponent(name.trim())}`}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Customize your interview →
                </Link>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-12 mt-16">
            {[
              { value: '134+', label: 'Questions' },
              { value: '3', label: 'Companies' },
              { value: '5', label: 'Interview Types' },
              { value: '4', label: 'Levels' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white font-mono">{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto mt-24 grid grid-cols-1 sm:grid-cols-3 gap-5 px-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="glass rounded-2xl p-6 light-edge hover:glass-elevated hover:scale-[1.02] transition-all duration-300 group cursor-default"
            >
              <div className="w-10 h-10 rounded-xl glass-surface flex items-center justify-center mb-4 group-hover:glow-active transition-all">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                </svg>
              </div>
              <div className="text-sm font-semibold text-white mb-2">{f.title}</div>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Companies */}
        <div className="mt-20 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-6">Prepare for</p>
          <div className="flex items-center justify-center gap-10">
            {['Meta', 'Google', 'Amazon'].map((c) => (
              <span key={c} className="text-xl font-semibold text-slate-500 hover:text-slate-300 transition-colors">{c}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
