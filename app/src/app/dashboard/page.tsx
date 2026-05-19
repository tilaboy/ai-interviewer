'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSessions, getStats, clearSessions, type InterviewSession } from '@/lib/session-store'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-red-400'
}

function scoreBarColor(score: number): string {
  if (score >= 75) return 'from-emerald-500 to-emerald-400'
  if (score >= 50) return 'from-amber-500 to-amber-400'
  return 'from-red-500 to-red-400'
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<InterviewSession[]>([])
  const [stats, setStats] = useState({ totalInterviews: 0, avgScore: 0, bestScore: 0, favoriteCompany: '-' })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setSessions(getSessions())
    setStats(getStats())
    setLoaded(true)
  }, [])

  const handleClear = () => {
    if (window.confirm('Clear all interview history? This cannot be undone.')) {
      clearSessions()
      setSessions([])
      setStats({ totalInterviews: 0, avgScore: 0, bestScore: 0, favoriteCompany: '-' })
    }
  }

  if (!loaded) return null

  return (
    <div className="bg-grid min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-gradient">Your Progress</span>
          </h1>
          <p className="text-slate-400">Track your interview practice sessions.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Interviews', value: stats.totalInterviews.toString() },
            { label: 'Avg Score', value: stats.avgScore.toString(), color: scoreColor(stats.avgScore) },
            { label: 'Best Score', value: stats.bestScore.toString(), color: scoreColor(stats.bestScore) },
            { label: 'Top Company', value: stats.favoriteCompany },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl p-5 text-center">
              <div className={`text-3xl font-bold font-mono ${s.color || 'text-white'}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Session list */}
        {sessions.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-lg font-semibold text-white mb-2">No interviews yet</h2>
            <p className="text-slate-400 mb-6">Start your first practice session to see your progress here.</p>
            <Link
              href="/setup"
              className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl hover:from-blue-400 hover:to-indigo-500 transition-all"
            >
              Start Practicing
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Recent Sessions</h2>
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="glass rounded-xl p-5 hover:bg-slate-800/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl font-bold font-mono ${scoreColor(s.overallScore)}`}>
                        {s.overallScore}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white capitalize">{s.company}</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-sm text-slate-400">{s.role.toUpperCase()}</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-sm text-slate-400 capitalize">{s.level}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {s.interviewType.replace(/_/g, ' ')} · {timeAgo(s.completedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:block w-32">
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${scoreBarColor(s.overallScore)}`}
                          style={{ width: `${s.overallScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {s.levelAssessment && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-1">{s.levelAssessment}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleClear}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                Clear History
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
