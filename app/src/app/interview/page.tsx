'use client'

import { useState, useCallback, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Chat from '@/components/Chat'
import Timer from '@/components/Timer'
import type { Message } from '@/types/message'

const INTERVIEW_DURATION_SECONDS = 45 * 60

function InterviewContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const company = searchParams.get('company') || 'meta'
  const role = searchParams.get('role') || 'swe'
  const level = searchParams.get('level') || 'mid'
  const interviewType = searchParams.get('type') || 'behavioral'

  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTimerRunning, setIsTimerRunning] = useState(true)
  const [interviewEnded, setInterviewEnded] = useState(false)
  const initialized = useRef(false)

  const config = { company, role, level, interviewType }

  // Fetch initial interviewer greeting on mount
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    async function initInterview() {
      setIsLoading(true)
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [], config }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to start interview')
        }

        const text = await readStream(res)
        setMessages([
          {
            id: crypto.randomUUID(),
            role: 'interviewer',
            content: text,
            timestamp: new Date(),
          },
        ])
      } catch (e) {
        setMessages([
          {
            id: crypto.randomUUID(),
            role: 'interviewer',
            content: `Failed to start interview: ${e instanceof Error ? e.message : 'Unknown error'}. Please check that ANTHROPIC_API_KEY is set in your .env.local file.`,
            timestamp: new Date(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    initInterview()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (interviewEnded) return

      const candidateMessage: Message = {
        id: crypto.randomUUID(),
        role: 'candidate',
        content: text,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, candidateMessage])
      setIsLoading(true)

      // Build conversation history for the API (map to user/assistant roles)
      const apiMessages = [...messages, candidateMessage].map((m) => ({
        role: m.role === 'candidate' ? ('user' as const) : ('assistant' as const),
        content: m.content,
      }))

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages, config }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to get response')
        }

        const text = await readStream(res)
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'interviewer',
            content: text,
            timestamp: new Date(),
          },
        ])
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'interviewer',
            content: `Error: ${e instanceof Error ? e.message : 'Failed to get response'}`,
            timestamp: new Date(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [messages, config, interviewEnded]
  )

  const handleTimeUp = useCallback(() => {
    setIsTimerRunning(false)
    setInterviewEnded(true)
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'interviewer',
        content:
          "That's all the time we have. Thank you for your responses today — it was a great conversation. We'll have your feedback ready shortly.",
        timestamp: new Date(),
      },
    ])
  }, [])

  const handleEndInterview = useCallback(() => {
    setIsTimerRunning(false)
    setInterviewEnded(true)

    // Store transcript and config for the feedback page
    const transcript = messages.map((m) => ({
      role: m.role === 'candidate' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    }))
    sessionStorage.setItem('interview_transcript', JSON.stringify(transcript))
    sessionStorage.setItem('interview_config', JSON.stringify(config))

    router.push('/feedback')
  }, [messages, config, router])

  const displayCompany = company.charAt(0).toUpperCase() + company.slice(1)
  const displayType = interviewType.replace(/_/g, ' ')

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <header className="flex-shrink-0 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto w-full">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-gray-100 truncate">
              {displayCompany} &middot; {role.toUpperCase()}
            </h1>
            <p className="text-xs text-gray-400">
              {level} &middot; {displayType.charAt(0).toUpperCase() + displayType.slice(1)} Interview
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Timer
              totalSeconds={INTERVIEW_DURATION_SECONDS}
              onTimeUp={handleTimeUp}
              isRunning={isTimerRunning}
            />
            <button
              onClick={handleEndInterview}
              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            >
              End Interview
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden max-w-4xl mx-auto w-full">
        <Chat
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </main>
    </div>
  )
}

async function readStream(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let result = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    result += decoder.decode(value, { stream: true })
  }

  return result
}

export default function InterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-gray-900">
          <p className="text-gray-400">Loading interview...</p>
        </div>
      }
    >
      <InterviewContent />
    </Suspense>
  )
}
