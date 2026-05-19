'use client'

import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react'

interface SplitPaneProps {
  left: ReactNode
  right: ReactNode
  defaultSplit?: number
  leftLabel?: string
  rightLabel?: string
}

const MIN_SPLIT = 30
const MAX_SPLIT = 70

export default function SplitPane({
  left,
  right,
  defaultSplit = 50,
  leftLabel = 'Code',
  rightLabel = 'Chat',
}: SplitPaneProps) {
  const [split, setSplit] = useState(defaultSplit)
  const [isDragging, setIsDragging] = useState(false)
  const [activePanel, setActivePanel] = useState<'left' | 'right'>('left')
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Detect mobile breakpoint
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setSplit(Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, pct)))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  // Mobile: stacked with tab toggle
  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {/* Tab bar */}
        <div className="flex border-b border-gray-700 bg-gray-800">
          <button
            onClick={() => setActivePanel('left')}
            className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
              activePanel === 'left'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-900'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {leftLabel}
          </button>
          <button
            onClick={() => setActivePanel('right')}
            className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
              activePanel === 'right'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-900'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {rightLabel}
          </button>
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-hidden">
          <div className={activePanel === 'left' ? 'h-full' : 'hidden'}>
            {left}
          </div>
          <div className={activePanel === 'right' ? 'h-full' : 'hidden'}>
            {right}
          </div>
        </div>
      </div>
    )
  }

  // Desktop: side-by-side with draggable divider
  return (
    <div
      ref={containerRef}
      className={`flex h-full ${isDragging ? 'select-none' : ''}`}
    >
      {/* Left panel */}
      <div style={{ width: `${split}%` }} className="h-full overflow-hidden">
        {left}
      </div>

      {/* Draggable divider */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-1 flex-shrink-0 cursor-col-resize transition-colors duration-150 ${
          isDragging ? 'bg-blue-500' : 'bg-gray-600 hover:bg-blue-500'
        }`}
      />

      {/* Right panel */}
      <div
        style={{ width: `${100 - split}%` }}
        className="h-full overflow-hidden"
      >
        {right}
      </div>
    </div>
  )
}
