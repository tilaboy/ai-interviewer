'use client'

import { useState, useEffect, useCallback } from 'react'

interface TimerProps {
  totalSeconds: number
  onTimeUp: () => void
  isRunning: boolean
}

export default function Timer({ totalSeconds, onTimeUp, isRunning }: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)

  useEffect(() => {
    setSecondsLeft(totalSeconds)
  }, [totalSeconds])

  const handleTimeUp = useCallback(() => {
    onTimeUp()
  }, [onTimeUp])

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isRunning, secondsLeft, handleTimeUp])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const isWarning = secondsLeft <= 300 && secondsLeft > 60
  const isCritical = secondsLeft <= 60

  let style = 'bg-slate-800/60 border-slate-700/50 text-slate-300'
  if (isCritical) {
    style = 'bg-red-900/30 border-red-500/40 text-red-400'
  } else if (isWarning) {
    style = 'bg-amber-900/20 border-amber-500/30 text-amber-400'
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-all duration-300 ${style}`}>
      <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className={`font-mono text-sm font-semibold tabular-nums ${isCritical ? 'animate-pulse' : ''}`}>
        {display}
      </span>
    </div>
  )
}
