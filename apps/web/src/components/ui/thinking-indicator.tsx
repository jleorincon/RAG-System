import React from 'react'
import { cn } from '@/lib/utils'

interface ThinkingIndicatorProps {
  className?: string
}

export function ThinkingIndicator({ className }: ThinkingIndicatorProps) {
  return (
    <div className={cn("flex items-center space-x-1 text-muted-foreground", className)}>
      <span className="text-sm">AI is thinking</span>
      <div className="flex space-x-1">
        <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
      </div>
    </div>
  )
} 