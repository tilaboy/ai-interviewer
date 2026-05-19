'use client'

import { useState, useCallback, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Chat from '@/components/Chat'
import Timer from '@/components/Timer'
import CodeEditor from '@/components/CodeEditor'
import AiAssistantPanel from '@/components/AiAssistantPanel'
import SplitPane from '@/components/SplitPane'
import type { Message } from '@/types/message'

const DrawingCanvas = dynamic(() => import('@/components/DrawingCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900">
      <p className="text-gray-400 text-sm">Loading canvas...</p>
    </div>
  ),
})

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
 * Extract the first fenced code block from an interviewer message.
 * Returns { lang, code } or null if no code block found.
 */
function extractCodeBlock(text: string): { lang: string; code: string } | null {
  const match = text.match(/```(\w+)?\s*\n([\s\S]*?)```/)
  if (!match) return null
  return { lang: match[1]?.toLowerCase() || 'python', code: match[2].trimEnd() }
}

interface PromptLogEntry {
  prompt: string
  response: string
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

/**
 * Formats the candidate message for ai_native_coding interviews, including
 * a summary of recent AI assistant interactions so the interviewer can
 * observe how the candidate uses AI tools.
 */
function buildAiNativeContextMessage(
  text: string,
  code: string,
  language: string,
  promptHistory: PromptLogEntry[]
): string {
  const parts: string[] = []

  if (promptHistory.length > 0) {
    const recent = promptHistory.slice(-5)
    parts.push(`[AI Assistant Usage]`)
    parts.push(
      `The candidate sent ${promptHistory.length} prompt${promptHistory.length === 1 ? '' : 's'} to the AI assistant${promptHistory.length > 5 ? ' (showing last 5)' : ''}:`
    )
    recent.forEach((entry, i) => {
      const truncatedResponse =
        entry.response.length > 150
          ? entry.response.slice(0, 150) + '...'
          : entry.response
      parts.push(
        `${i + 1}. "${entry.prompt}" → [assistant responded: ${truncatedResponse}]`
      )
    })
    parts.push('')
  }

  parts.push(`[Current code]`)
  parts.push(`\`\`\`${language}\n${code}\n\`\`\``)
  parts.push('')
  parts.push(`[Candidate message]`)
  parts.push(text)

  return parts.join('\n')
}

function InterviewContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const company = searchParams.get('company') || 'meta'
  const role = searchParams.get('role') || 'swe'
  const level = searchParams.get('level') || 'mid'
  const interviewType = searchParams.get('type') || 'behavioral'
  const candidateName = searchParams.get('name') || ''

  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTimerRunning, setIsTimerRunning] = useState(true)
  const [interviewEnded, setInterviewEnded] = useState(false)
  const initialized = useRef(false)

  // Code editor state (only used for coding interview types)
  const [code, setCode] = useState(DEFAULT_CODE_BY_LANGUAGE['python'])
  const [language, setLanguage] = useState('python')

  // Diagram snapshot state (only used for design interview types)
  const [diagramSnapshot, setDiagramSnapshot] = useState<string | null>(null)

  // AI assistant prompt history (only used for ai_native_coding)
  const [promptHistory, setPromptHistory] = useState<PromptLogEntry[]>([])

  const config = { company, role, level, interviewType, candidateName }

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

  const handlePromptLog = useCallback(
    (prompt: string, response: string) => {
      setPromptHistory((prev) => [...prev, { prompt, response }])
    },
    []
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

        const responseText = await readStream(res)

        // If it's a coding interview, extract code block and populate editor
        if (isCodingType(interviewType)) {
          const codeBlock = extractCodeBlock(responseText)
          if (codeBlock) {
            setCode(codeBlock.code)
            if (codeBlock.lang && codeBlock.lang !== language) {
              setLanguage(codeBlock.lang)
            }
          }
        }

        setMessages([
          {
            id: crypto.randomUUID(),
            role: 'interviewer',
            content: responseText,
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
      let apiContent: string
      if (interviewType === 'ai_native_coding') {
        apiContent = buildAiNativeContextMessage(text, code, language, promptHistory)
      } else if (isCodingType(interviewType)) {
        apiContent = buildCodeContextMessage(text, code, language)
      } else {
        apiContent = text
      }

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

        const responseText2 = await readStream(res)

        // Auto-populate editor if interviewer sends a code block in follow-up
        if (isCodingType(interviewType)) {
          const codeBlock = extractCodeBlock(responseText2)
          if (codeBlock) {
            setCode(codeBlock.code)
            if (codeBlock.lang && codeBlock.lang !== language) {
              setLanguage(codeBlock.lang)
            }
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'interviewer',
            content: responseText2,
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
    [messages, config, interviewEnded, interviewType, code, language, promptHistory]
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

    // For ai_native_coding, store the prompt history
    if (interviewType === 'ai_native_coding') {
      sessionStorage.setItem(
        'interview_prompts',
        JSON.stringify(promptHistory)
      )
    }

    // For design interviews, store the diagram snapshot if available
    if (isDesignType(interviewType) && diagramSnapshot) {
      sessionStorage.setItem('interview_diagram', diagramSnapshot)
    }

    router.push('/feedback')
  }, [messages, config, router, interviewType, language, code, diagramSnapshot, promptHistory])

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

  const leftPanel =
    interviewType === 'ai_native_coding' ? (
      <AiAssistantPanel
        code={code}
        language={language}
        onCodeChange={setCode}
        onLanguageChange={handleLanguageChange}
        onPromptLog={handlePromptLog}
        readOnly={interviewEnded}
      />
    ) : interviewType === 'coding' ? (
      <CodeEditor
        language={language}
        code={code}
        onChange={setCode}
        onLanguageChange={handleLanguageChange}
        readOnly={interviewEnded}
      />
    ) : isDesignType(interviewType) ? (
      <DrawingCanvas onSnapshot={setDiagramSnapshot} />
    ) : null

  return (
    <div className="flex flex-col h-screen bg-[#0a0f1e] text-slate-100">
      <header className="flex-shrink-0 border-b border-slate-800/50 bg-[#0a0f1e]/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3 w-full">
          <div className="min-w-0 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-mono bg-slate-800/80 rounded text-slate-300 capitalize">{displayCompany}</span>
              <span className="px-2 py-0.5 text-xs font-mono bg-slate-800/80 rounded text-slate-300">{role.toUpperCase()}</span>
              <span className="px-2 py-0.5 text-xs font-mono bg-slate-800/80 rounded text-slate-300 capitalize">{level}</span>
            </div>
            <span className="text-xs text-slate-500">{displayType.charAt(0).toUpperCase() + displayType.slice(1)}</span>
          </div>

          <div className="flex items-center gap-3">
            <Timer
              totalSeconds={INTERVIEW_DURATION_SECONDS}
              onTimeUp={handleTimeUp}
              isRunning={isTimerRunning}
            />
            <button
              onClick={handleEndInterview}
              className="rounded-lg bg-red-500/80 px-3 py-2 text-xs font-medium text-white hover:bg-red-500 transition-all"
            >
              End Interview
            </button>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      </header>

      <main className="flex-1 overflow-hidden">
        {showSplitPane && leftPanel ? (
          <SplitPane
            left={leftPanel}
            right={chatPanel}
            defaultSplit={55}
            leftLabel={isCodingType(interviewType) ? 'Code' : 'Whiteboard'}
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
