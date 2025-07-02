'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSendMessage: (message: string, useWebSearch?: boolean) => void
  onStopGeneration?: () => void
  disabled?: boolean
  isGenerating?: boolean
  placeholder?: string
  className?: string
}

export function ChatInput({
  onSendMessage,
  onStopGeneration,
  disabled = false,
  isGenerating = false,
  placeholder = "Ask questions about documents you uploaded, or search for current information...",
  className
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled && !isGenerating) {
      onSendMessage(message.trim(), false) // Let the backend decide on data sources
      setMessage('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleStop = () => {
    onStopGeneration?.()
  }

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [message])

  return (
    <div className={cn("border-t bg-background p-4", className)}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background",
              "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "min-h-[40px] max-h-[120px]"
            )}
            rows={1}
          />
        </div>
        
        {isGenerating ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={handleStop}
            className="h-10 w-10 shrink-0"
          >
            <Square className="h-4 w-4" />
            <span className="sr-only">Stop generation</span>
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={disabled || !message.trim()}
            className="h-10 w-10 shrink-0"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        )}
      </form>
    </div>
  )
} 