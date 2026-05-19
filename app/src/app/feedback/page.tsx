'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { saveSession } from '@/lib/session-store'

interface FeedbackDimension {
  name: string
  score: number
  evidence: string[]
}

interface FeedbackSignal {
  quote: string
  signal: string
  dimension: string
}

interface FeedbackResponse {
  overallScore: number
  levelAssessment: string
  dimensions: FeedbackDimension[]
  positiveSignals: FeedbackSignal[]
  negativeSignals: FeedbackSignal[]
  improvements: string[]
}

interface InterviewConfig {
  company: string
  role: string
  level: string
  interviewType: string
}

function ScoreBar({ score, maxScore = 100 }: { score: number; maxScore?: number }) {
  const pct = Math.min((score / maxScore) * 100, 100)
  let barColor = 'from-emerald-500 to-emerald-400'
  if (pct < 50) barColor = 'from-red-500 to-red-400'
  else if (pct < 75) barColor = 'from-amber-500 to-amber-400'

  return (
    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function FeedbackContent() {
  const router = useRouter()
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null)
  const [config, setConfig] = useState<InterviewConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const saved = useRef(false)

  useEffect(() => {
    async function loadFeedback() {
      const transcriptStr = sessionStorage.getItem('interview_transcript')
      const configStr = sessionStorage.getItem('interview_config')

      if (!transcriptStr || !configStr) {
        setError('No interview data found. Please complete an interview first.')
        setLoading(false)
        return
      }

      const interviewConfig = JSON.parse(configStr) as InterviewConfig
      setConfig(interviewConfig)

      // For ai_native_coding, include prompt history in the feedback request
      const promptsStr = sessionStorage.getItem('interview_prompts')
      const prompts = promptsStr ? JSON.parse(promptsStr) : undefined

      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: JSON.parse(transcriptStr),
            config: interviewConfig,
            ...(interviewConfig.interviewType === 'ai_native_coding' && prompts
              ? { promptHistory: prompts }
              : {}),
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to generate feedback')
        }

        const data = (await res.json()) as FeedbackResponse
        setFeedback(data)

        if (!saved.current) {
          saved.current = true
          saveSession({
            id: crypto.randomUUID(),
            company: interviewConfig.company,
            role: interviewConfig.role,
            level: interviewConfig.level,
            interviewType: interviewConfig.interviewType,
            overallScore: data.overallScore,
            levelAssessment: data.levelAssessment,
            dimensions: data.dimensions.map((d) => ({ name: d.name, score: d.score })),
            completedAt: new Date().toISOString(),
          })
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to generate feedback')
      } finally {
        setLoading(false)
      }
    }

    loadFeedback()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0f1e] text-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4" />
        <p className="text-slate-400 text-lg">Analyzing your interview...</p>
        <p className="text-gray-500 text-sm mt-2">This may take 30-60 seconds</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0f1e] text-slate-100">
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <button
          onClick={() => router.push('/setup')}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Start New Interview
        </button>
      </div>
    )
  }

  if (!feedback || !config) return null

  const displayCompany = config.company.charAt(0).toUpperCase() + config.company.slice(1)
  const displayType = config.interviewType.replace(/_/g, ' ')

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100">
      <header className="border-b border-slate-700/50 glass">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Interview Feedback</h1>
            <p className="text-xs text-slate-400">
              {displayCompany} &middot; {config.role.toUpperCase()} &middot; {config.level} &middot;{' '}
              {displayType.charAt(0).toUpperCase() + displayType.slice(1)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/interview?company=${config.company}&role=${config.role}&level=${config.level}&type=${config.interviewType}`)}
              className="rounded-lg border border-gray-600 bg-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-600 transition-colors"
            >
              Retry Interview
            </button>
            <button
              onClick={() => router.push('/setup')}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500 transition-colors"
            >
              New Interview
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        {/* Overall Score */}
        <section>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Overall Score
          </h2>
          <div className="glass rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-end gap-4 mb-3">
              <span className="text-5xl font-bold font-mono tabular-nums text-slate-100">
                {feedback.overallScore}
              </span>
              <span className="text-lg text-slate-400 mb-1">/ 100</span>
            </div>
            <ScoreBar score={feedback.overallScore} />
            <p className="mt-3 text-sm text-slate-400">
              {feedback.levelAssessment}
            </p>
          </div>
        </section>

        {/* Dimension Scores */}
        <section>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Dimension Scores
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {feedback.dimensions.map((dim) => (
              <div key={dim.name} className="glass rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-100">{dim.name}</h3>
                  <span className="text-sm font-mono text-slate-300">{dim.score}/100</span>
                </div>
                <ScoreBar score={dim.score} />
                <ul className="mt-2 space-y-1">
                  {dim.evidence.map((e, i) => (
                    <li key={i} className="text-xs text-slate-400 leading-relaxed">
                      • {e}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Positive Signals */}
        {feedback.positiveSignals.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
              ✓ Positive Signals
            </h2>
            <div className="space-y-3">
              {feedback.positiveSignals.map((sig, i) => (
                <div key={i} className="bg-green-900/20 border border-green-800 rounded-xl p-4">
                  <p className="text-sm text-slate-200 italic mb-2">&ldquo;{sig.quote}&rdquo;</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-green-400">{sig.signal}</span>
                    <span className="text-xs text-gray-500">({sig.dimension})</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Negative Signals */}
        {feedback.negativeSignals.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
              ✗ Areas to Improve
            </h2>
            <div className="space-y-3">
              {feedback.negativeSignals.map((sig, i) => (
                <div key={i} className="bg-red-900/20 border border-red-800 rounded-xl p-4">
                  <p className="text-sm text-slate-200 italic mb-2">&ldquo;{sig.quote}&rdquo;</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-red-400">{sig.signal}</span>
                    <span className="text-xs text-gray-500">({sig.dimension})</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Improvement Suggestions */}
        <section>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Top Improvements
          </h2>
          <div className="glass rounded-xl p-6 border border-slate-700/50 space-y-4">
            {feedback.improvements.map((imp, i) => (
              <div key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                  {i + 1}
                </span>
                <p className="text-sm text-slate-300 leading-relaxed">{imp}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default function FeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#0a0f1e]">
          <p className="text-slate-400">Loading feedback...</p>
        </div>
      }
    >
      <FeedbackContent />
    </Suspense>
  )
}
