'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Message } from '@/types/message'

interface ChatProps {
  messages: Message[]
  onSendMessage: (text: string) => void
  isLoading: boolean
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 max-w-[80%]">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-slate-700/50">
        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>
      <div className="bg-slate-800/80 border-l-2 border-blue-500/50 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isInterviewer = message.role === 'interviewer'

  return (
    <div className={`flex items-start gap-3 ${isInterviewer ? 'justify-start' : 'justify-end'}`}>
      {isInterviewer && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center border border-slate-700/50">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
      )}

      <div className="max-w-[75%]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-slate-400">
            {isInterviewer ? 'Interviewer' : 'You'}
          </span>
          <span className="text-xs text-slate-600">{formatTime(message.timestamp)}</span>
        </div>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isInterviewer
              ? 'bg-slate-800/80 text-slate-100 rounded-tl-sm border-l-2 border-blue-500/40'
              : 'bg-blue-600/80 text-white rounded-tr-sm'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>

      {!isInterviewer && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Speech recognition hook
// ---------------------------------------------------------------------------

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null)
  const onResultRef = useRef<(text: string) => void>(() => {})
  const onSilenceRef = useRef<(() => void) | undefined>(undefined)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    )
  }, [])

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
      setIsListening(false)
      onSilenceRef.current?.()
    }, 2000)
  }, [])

  const start = useCallback((onResult: (text: string) => void, onSilence?: () => void) => {
    if (!isSupported || isListening) return

    const recognition = createRecognition()
    if (!recognition) return

    onResultRef.current = onResult
    onSilenceRef.current = onSilence
    recognitionRef.current = recognition

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    let finalTranscript = ''

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interim = transcript
        }
      }
      onResultRef.current(finalTranscript + interim)
      resetSilenceTimer()
    }

    recognition.onend = () => {
      setIsListening(false)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    }

    recognition.onerror = () => {
      setIsListening(false)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    }

    recognition.start()
    setIsListening(true)
    resetSilenceTimer()
  }, [isSupported, isListening, resetSilenceTimer])

  const stop = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  return { isListening, isSupported, start, stop }
}

function createRecognition() {
  if (typeof window === 'undefined') return null
  const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  if (!SpeechRecognition) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (SpeechRecognition as any)()
}

// ---------------------------------------------------------------------------
// Chat component
// ---------------------------------------------------------------------------

export default function Chat({ messages, onSendMessage, isLoading }: ChatProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { isListening, isSupported, start, stop } = useSpeechRecognition()
  const preVoiceInput = useRef('')
  const inputRef2 = useRef(input)
  inputRef2.current = input

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const sendCurrentInput = useCallback(() => {
    const trimmed = inputRef2.current.trim()
    if (!trimmed || isLoading) return
    onSendMessage(trimmed)
    setInput('')
    preVoiceInput.current = ''
  }, [isLoading, onSendMessage])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isListening) stop()
    sendCurrentInput()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const toggleVoice = () => {
    if (isListening) {
      stop()
      sendCurrentInput()
    } else {
      preVoiceInput.current = input
      start(
        (text) => {
          setInput(preVoiceInput.current + (preVoiceInput.current ? ' ' : '') + text)
        },
        () => {
          // Auto-send after 2s of silence
          sendCurrentInput()
        }
      )
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e]">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500 text-sm">Your interview will begin shortly...</p>
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-800/50 bg-[#0a0f1e]/90 backdrop-blur-sm px-4 py-3">
        {isListening && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-xs text-red-400">Listening — auto-sends after you pause</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening...' : 'Type or speak your answer...'}
            rows={1}
            className={`flex-1 resize-none rounded-xl bg-slate-800/60 border px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 max-h-32 transition-all ${
              isListening ? 'border-red-500/40 ring-1 ring-red-500/20' : 'border-slate-700/50'
            }`}
            disabled={isLoading}
          />

          {isSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              disabled={isLoading}
              className={`flex-shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium transition-all focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed ${
                isListening
                  ? 'bg-red-500/80 text-white hover:bg-red-500 ring-2 ring-red-500/30'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-white hover:bg-slate-700/60'
              }`}
              title={isListening ? 'Stop recording' : 'Start voice input'}
            >
              {isListening ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
          )}

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:from-blue-400 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
