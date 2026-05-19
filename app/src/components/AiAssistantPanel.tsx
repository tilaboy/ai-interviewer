'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import CodeEditor from '@/components/CodeEditor'

interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface AiAssistantPanelProps {
  code: string
  language: string
  onCodeChange: (code: string) => void
  onLanguageChange: (lang: string) => void
  onPromptLog: (prompt: string, response: string) => void
  readOnly?: boolean
}

function AssistantTypingIndicator() {
  return (
    <div className="flex items-start gap-2 max-w-[85%]">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center">
        <svg
          className="w-3 h-3 text-indigo-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      </div>
      <div className="bg-indigo-900/40 border border-indigo-800/50 rounded-xl rounded-tl-sm px-3 py-2">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

function AssistantMessageBubble({ message }: { message: AssistantMessage }) {
  const isAssistant = message.role === 'assistant'

  return (
    <div
      className={`flex items-start gap-2 ${
        isAssistant ? 'justify-start' : 'justify-end'
      }`}
    >
      {isAssistant && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center">
          <svg
            className="w-3 h-3 text-indigo-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
      )}

      <div className={`max-w-[85%] ${isAssistant ? '' : ''}`}>
        <div
          className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
            isAssistant
              ? 'bg-indigo-900/40 border border-indigo-800/50 text-gray-100 rounded-tl-sm'
              : 'bg-indigo-600 text-white rounded-tr-sm'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>

      {!isAssistant && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      )}
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

export default function AiAssistantPanel({
  code,
  language,
  onCodeChange,
  onLanguageChange,
  onPromptLog,
  readOnly = false,
}: AiAssistantPanelProps) {
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [assistantMessages, isLoading])

  const handleSendPrompt = useCallback(
    async (promptText: string) => {
      if (readOnly || isLoading) return

      const userMessage: AssistantMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: promptText,
        timestamp: new Date(),
      }

      setAssistantMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptText,
            code,
            language,
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to get response')
        }

        const responseText = await readStream(res)

        const assistantMsg: AssistantMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
        }

        setAssistantMessages((prev) => [...prev, assistantMsg])
        onPromptLog(promptText, responseText)
      } catch (e) {
        const errorContent = `Error: ${e instanceof Error ? e.message : 'Failed to get response'}`
        const errorMsg: AssistantMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: errorContent,
          timestamp: new Date(),
        }
        setAssistantMessages((prev) => [...prev, errorMsg])
        onPromptLog(promptText, errorContent)
      } finally {
        setIsLoading(false)
      }
    },
    [code, language, readOnly, isLoading, onPromptLog]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading || readOnly) return
    handleSendPrompt(trimmed)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      {/* Code editor area (~65%) */}
      <div className="flex-[65] min-h-0 overflow-hidden">
        <CodeEditor
          language={language}
          code={code}
          onChange={onCodeChange}
          onLanguageChange={onLanguageChange}
          readOnly={readOnly}
        />
      </div>

      {/* Visual separator */}
      <div className="flex-shrink-0 h-px bg-indigo-600/50" />

      {/* AI Assistant chat area (~35%) */}
      <div className="flex-[35] min-h-0 flex flex-col bg-gray-900">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-indigo-800/40 bg-indigo-950/30">
          <svg
            className="w-4 h-4 text-indigo-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <span className="text-xs font-semibold text-indigo-300">
            AI Coding Assistant
          </span>
          {readOnly && (
            <span className="ml-auto text-[10px] text-gray-500 uppercase tracking-wider">
              Read only
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {assistantMessages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-xs text-center">
                Ask the AI assistant for help with your code.
              </p>
            </div>
          )}
          {assistantMessages.map((msg) => (
            <AssistantMessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && <AssistantTypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-indigo-800/40 bg-gray-800/50 px-3 py-2">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the AI assistant..."
              rows={1}
              className="flex-1 resize-none rounded-lg bg-gray-700 border border-indigo-700/40 px-3 py-2 text-xs text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent max-h-20 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={isLoading || readOnly}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || readOnly}
              className="flex-shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
