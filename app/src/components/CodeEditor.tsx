'use client'

import { useCallback } from 'react'
import Editor from '@monaco-editor/react'

const LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
] as const

interface CodeEditorProps {
  language: string
  code: string
  onChange: (code: string) => void
  onLanguageChange?: (language: string) => void
  readOnly?: boolean
}

export default function CodeEditor({
  language,
  code,
  onChange,
  onLanguageChange,
  readOnly = false,
}: CodeEditorProps) {
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      onChange(value ?? '')
    },
    [onChange]
  )

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      {/* Language selector toolbar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-700 bg-[#252526]">
        <label
          htmlFor="language-select"
          className="text-xs font-medium text-gray-400"
        >
          Language
        </label>
        <select
          id="language-select"
          value={language}
          onChange={(e) => onLanguageChange?.(e.target.value)}
          disabled={readOnly}
          className="rounded bg-[#3c3c3c] border border-gray-600 px-2 py-1 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            tabSize: 4,
            wordWrap: 'on',
            readOnly,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12 },
            lineNumbersMinChars: 3,
            folding: true,
            renderLineHighlight: 'line',
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
              <p className="text-gray-500 text-sm">Loading editor...</p>
            </div>
          }
        />
      </div>
    </div>
  )
}
