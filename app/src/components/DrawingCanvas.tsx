'use client'

import { useCallback } from 'react'
import { Tldraw, useEditor, getSnapshot } from 'tldraw'
import 'tldraw/tldraw.css'

interface DrawingCanvasProps {
  onSnapshot?: (snapshot: string) => void
}

/**
 * Inner toolbar component that lives inside the Tldraw context
 * so it can access the editor instance via useEditor.
 */
function SnapshotToolbar({
  onSnapshot,
}: {
  onSnapshot?: (snapshot: string) => void
}) {
  const editor = useEditor()

  const handleExportSnapshot = useCallback(() => {
    if (!onSnapshot) return
    const snapshot = getSnapshot(editor.store)
    onSnapshot(JSON.stringify(snapshot))
  }, [editor, onSnapshot])

  if (!onSnapshot) return null

  return (
    <div className="absolute top-2 right-2 z-[300]">
      <button
        onClick={handleExportSnapshot}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        Export Snapshot
      </button>
    </div>
  )
}

export default function DrawingCanvas({ onSnapshot }: DrawingCanvasProps) {
  return (
    <div className="relative h-full w-full">
      <Tldraw colorScheme="dark">
        <SnapshotToolbar onSnapshot={onSnapshot} />
      </Tldraw>
    </div>
  )
}
