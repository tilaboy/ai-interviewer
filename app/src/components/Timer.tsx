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

  let textColor = 'text-gray-100'
  let bgColor = 'bg-gray-800'
  let borderColor = 'border-gray-700'

  if (isCritical) {
    textColor = 'text-red-400'
    bgColor = 'bg-red-900/30'
    borderColor = 'border-red-800'
  } else if (isWarning) {
    textColor = 'text-yellow-400'
    bgColor = 'bg-yellow-900/20'
    borderColor = 'border-yellow-800'
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 ${bgColor} ${borderColor} transition-colors duration-300`}
    >
      <svg
        className={`w-4 h-4 ${textColor}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span
        className={`font-mono text-lg font-semibold tabular-nums ${textColor} ${
          isCritical ? 'animate-pulse' : ''
        }`}
      >
        {display}
      </span>
    </div>
  )
}
