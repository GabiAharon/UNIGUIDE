import React, { useRef, useEffect } from 'react'

interface EditorProps {
  content: string
  onChange: (content: string) => void
}

const Editor: React.FC<EditorProps> = ({ content, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = textarea.value
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      
      onChange(newValue)
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
  }

  return (
    <div className="h-full relative">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="w-full h-full p-4 bg-gray-900 text-green-400 font-mono text-sm leading-relaxed resize-none outline-none border-none"
        style={{
          fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
          fontSize: '14px',
          lineHeight: '1.6',
          tabSize: 2
        }}
        placeholder="הכנס את הקוד כאן..."
        spellCheck={false}
        dir="ltr"
      />
      
      {/* Line numbers overlay */}
      <div className="absolute top-0 left-0 p-4 pointer-events-none text-gray-600 font-mono text-sm leading-relaxed select-none">
        {content.split('\n').map((_, index) => (
          <div key={index} className="text-right" style={{ lineHeight: '1.6' }}>
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Editor