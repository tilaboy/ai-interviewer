export interface InterviewSession {
  id: string
  company: string
  role: string
  level: string
  interviewType: string
  overallScore: number
  levelAssessment: string
  dimensions: { name: string; score: number }[]
  completedAt: string
}

const STORAGE_KEY = 'ai_interviewer_sessions'
const MAX_SESSIONS = 50

export function saveSession(session: InterviewSession): void {
  const sessions = getSessions()
  sessions.unshift(session)
  if (sessions.length > MAX_SESSIONS) sessions.length = MAX_SESSIONS
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

export function getSessions(): InterviewSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function clearSessions(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function getStats() {
  const sessions = getSessions()
  if (sessions.length === 0) {
    return { totalInterviews: 0, avgScore: 0, bestScore: 0, favoriteCompany: '-' }
  }
  const scores = sessions.map((s) => s.overallScore)
  const companyCount: Record<string, number> = {}
  sessions.forEach((s) => { companyCount[s.company] = (companyCount[s.company] || 0) + 1 })
  const favoriteCompany = Object.entries(companyCount).sort((a, b) => b[1] - a[1])[0][0]
  return {
    totalInterviews: sessions.length,
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    bestScore: Math.max(...scores),
    favoriteCompany: favoriteCompany.charAt(0).toUpperCase() + favoriteCompany.slice(1),
  }
}
