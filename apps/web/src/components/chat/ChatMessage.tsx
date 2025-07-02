'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { User, Bot, ExternalLink, ThumbsUp, ThumbsDown, Trophy, Globe, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Source {
  id: string
  content: string
  documentTitle?: string
  documentId: string
  chunkIndex: number
  similarity?: number
  source?: string
  type?: 'document' | 'web_content' | 'sports_data'
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  timestamp: Date
  isStreaming?: boolean
  interactionId?: string
  feedback?: number // -1, 0, 1
}

interface ChatMessageProps {
  message: Message
  onSourceClick?: (source: Source) => void
  onFeedback?: (messageId: string, feedback: number) => void
}

export function ChatMessage({ message, onSourceClick, onFeedback }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const [feedbackState, setFeedbackState] = useState<number>(message.feedback || 0)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)

  const handleFeedback = async (feedback: number) => {
    if (isSubmittingFeedback || !message.interactionId) return
    
    setIsSubmittingFeedback(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interaction_id: message.interactionId,
          feedback: feedback
        }),
      })

      if (response.ok) {
        setFeedbackState(feedback)
        onFeedback?.(message.id, feedback)
      } else {
        console.error('Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  return (
    <div className={cn(
      "flex w-full p-4 border-b",
      isUser ? "bg-muted/50" : "bg-background"
    )}>
      <div className="flex w-full gap-3">
        {/* Avatar */}
        <div className={cn(
          "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border",
          isUser ? "bg-background" : "bg-primary text-primary-foreground"
        )}>
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground">
            {isUser ? (
              // User messages: keep as plain text with line breaks
              <div className="whitespace-pre-wrap">
                {message.content}
              </div>
            ) : (
              // Assistant messages: render as markdown
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom styling for code blocks
                  code: ({ inline, className, children, ...props }: any) => {
                    return inline ? (
                      <code
                        className="bg-muted px-1 py-0.5 rounded text-sm font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-muted p-3 rounded-md overflow-x-auto">
                        <code className="text-sm font-mono" {...props}>
                          {children}
                        </code>
                      </pre>
                    )
                  },
                  // Custom styling for lists
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1 my-2">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1 my-2">
                      {children}
                    </ol>
                  ),
                  // Custom styling for links
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
            )}
          </div>

          {/* Sources */}
          {isAssistant && message.sources && message.sources.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Sources:</p>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((source) => {
                  // Determine icon and styling based on source type
                  const getSourceIcon = (type?: string) => {
                    switch (type) {
                      case 'sports_data':
                        return <Trophy className="h-3 w-3 mr-1" />
                      case 'web_content':
                        return <Globe className="h-3 w-3 mr-1" />
                      default:
                        return <FileText className="h-3 w-3 mr-1" />
                    }
                  }

                  const getSourceLabel = (source: Source) => {
                    if (source.type === 'sports_data') {
                      return source.content || 'Sports Data'
                    }
                    if (source.type === 'web_content') {
                      return source.documentTitle || 'Web Result'
                    }
                    return source.documentTitle || `Document ${source.documentId.slice(0, 8)}`
                  }

                  const getSourceVariant = (type?: string) => {
                    switch (type) {
                      case 'sports_data':
                        return 'default' as const
                      case 'web_content':
                        return 'secondary' as const
                      default:
                        return 'outline' as const
                    }
                  }

                  return (
                    <Button
                      key={source.id}
                      variant={getSourceVariant(source.type)}
                      size="sm"
                      onClick={() => onSourceClick?.(source)}
                      className={cn(
                        "h-auto p-2 text-xs",
                        source.type === 'sports_data' && "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300",
                        source.type === 'web_content' && "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300"
                      )}
                    >
                      {getSourceIcon(source.type)}
                      {getSourceLabel(source)}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Feedback Buttons - Only for assistant messages that aren't streaming */}
          {isAssistant && !message.isStreaming && message.interactionId && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs text-muted-foreground">Was this helpful?</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback(1)}
                disabled={isSubmittingFeedback}
                className={cn(
                  "h-8 w-8 p-0",
                  feedbackState === 1 && "bg-green-100 text-green-600 hover:bg-green-100"
                )}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback(-1)}
                disabled={isSubmittingFeedback}
                className={cn(
                  "h-8 w-8 p-0",
                  feedbackState === -1 && "bg-red-100 text-red-600 hover:bg-red-100"
                )}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 