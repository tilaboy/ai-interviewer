'use client'

import { useState, useCallback, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Chat from '@/components/Chat'
import Timer from '@/components/Timer'
import CodeEditor from '@/components/CodeEditor'
import SplitPane from '@/components/SplitPane'
import type { Message } from '@/types/message'

const INTERVIEW_DURATION_SECONDS = 45 * 60

const DEFAULT_CODE_BY_LANGUAGE: Record<string, string> = {
  python: '# Write your solution here\n\n',
  javascript: '// Write your solution here\n\n',
  typescript: '// Write your solution here\n\n',
  java: '// Write your solution here\n\npublic class Solution {\n    \n}\n',
  cpp: '// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\n',
  go: '// Write your solution here\npackage main\n\n',
}

function isCodingType(type: string): boolean {
  return type === 'coding' || type === 'ai_native_coding'
}

function isDesignType(type: string): boolean {
  return type === 'system_design' || type === 'ml_design'
}

/**
 * Formats the candidate message to include current code context for coding interviews.
 */
function buildCodeContextMessage(
  text: string,
  code: string,
  language: string
): string {
  return `[Current code]\n\`\`\`${language}\n${code}\n\`\`\`\n\n[Candidate message]\n${text}`
}

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

  // Code editor state (only used for coding interview types)
  const [code, setCode] = useState(DEFAULT_CODE_BY_LANGUAGE['python'])
  const [language, setLanguage] = useState('python')

  const config = { company, role, level, interviewType }

  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      // If the current code is still the default for the old language, swap to the new default
      const oldDefault = DEFAULT_CODE_BY_LANGUAGE[language] ?? ''
      if (code === oldDefault || code.trim() === '') {
        setCode(DEFAULT_CODE_BY_LANGUAGE[newLanguage] ?? '')
      }
      setLanguage(newLanguage)
    },
    [code, language]
  )

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

      // For coding interviews, include code context in the API message
      const apiContent = isCodingType(interviewType)
        ? buildCodeContextMessage(text, code, language)
        : text

      const candidateMessage: Message = {
        id: crypto.randomUUID(),
        role: 'candidate',
        content: text, // Display the original message in the chat UI
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, candidateMessage])
      setIsLoading(true)

      // Build conversation history for the API (map to user/assistant roles)
      // For past messages, use the stored content. For the new message, use apiContent.
      const apiMessages = [...messages].map((m) => ({
        role: m.role === 'candidate' ? ('user' as const) : ('assistant' as const),
        content: m.content,
      }))
      apiMessages.push({
        role: 'user' as const,
        content: apiContent,
      })

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
    [messages, config, interviewEnded, interviewType, code, language]
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

    // For coding interviews, also store the final code
    if (isCodingType(interviewType)) {
      sessionStorage.setItem(
        'interview_code',
        JSON.stringify({ language, code })
      )
    }

    router.push('/feedback')
  }, [messages, config, router, interviewType, language, code])

  const displayCompany = company.charAt(0).toUpperCase() + company.slice(1)
  const displayType = interviewType.replace(/_/g, ' ')

  // Determine layout based on interview type
  const showSplitPane = isCodingType(interviewType) || isDesignType(interviewType)

  const chatPanel = (
    <Chat
      messages={messages}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
    />
  )

  const leftPanel = isCodingType(interviewType) ? (
    <CodeEditor
      language={language}
      code={code}
      onChange={setCode}
      onLanguageChange={handleLanguageChange}
      readOnly={interviewEnded}
    />
  ) : isDesignType(interviewType) ? (
    <div className="flex items-center justify-center h-full bg-gray-900">
      <div className="text-center px-6">
        <svg
          className="w-16 h-16 text-gray-600 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
          />
        </svg>
        <p className="text-gray-400 text-sm font-medium">
          Drawing canvas coming in Phase 3
        </p>
        <p className="text-gray-500 text-xs mt-2">
          For now, describe your design in the chat panel
        </p>
      </div>
    </div>
  ) : null

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <header className="flex-shrink-0 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between px-4 py-3 w-full">
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

      <main className="flex-1 overflow-hidden">
        {showSplitPane && leftPanel ? (
          <SplitPane
            left={leftPanel}
            right={chatPanel}
            defaultSplit={55}
            leftLabel={isCodingType(interviewType) ? 'Code' : 'Design'}
            rightLabel="Chat"
          />
        ) : (
          <div className="max-w-4xl mx-auto w-full h-full">{chatPanel}</div>
        )}
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
