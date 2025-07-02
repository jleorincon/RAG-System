'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useChat } from 'ai/react'
import { ChatMessage, Message, Source } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { SourcePreview } from './SourcePreview'
import { ThinkingIndicator } from '@/components/ui/thinking-indicator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInterfaceProps {
  className?: string
  sessionId?: string
}

export function ChatInterface({ className, sessionId }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const [messageInteractionIds, setMessageInteractionIds] = useState<Record<string, string>>({})
  const [messageSources, setMessageSources] = useState<Record<string, Source[]>>({})

  const {
    messages,
    isLoading,
    stop,
    setMessages,
    append
  } = useChat({
    api: '/api/chat',
    streamProtocol: 'text',
    body: {
      sessionId
    },
    onResponse: async (response) => {
      // Extract sources from response headers
      try {
        const sourcesHeader = response.headers.get('X-Sources')
        if (sourcesHeader) {
          // Decode base64 encoded sources
          const decodedSources = atob(sourcesHeader)
          const sources = JSON.parse(decodedSources)
          // We'll need to associate these sources with the message once it's complete
          // Store them temporarily and associate them in onFinish
          setMessageSources(prev => ({
            ...prev,
            'pending': sources
          }))
        }
      } catch (error) {
        console.error('Failed to parse sources from headers:', error)
      }
    },
    onFinish: async (message) => {
      // Associate the pending sources with the completed message
      const pendingSources = messageSources['pending'] || []
      if (pendingSources.length > 0 && message.role === 'assistant') {
        setMessageSources(prev => {
          const updated = { ...prev }
          updated[message.id] = pendingSources
          delete updated['pending'] // Clean up pending sources
          return updated
        })
      }

      // Log the interaction when a message is completed
      if (message.role === 'assistant') {
        try {
          const userMessage = messages[messages.length - 1]
          const sources = pendingSources
          const response = await fetch('/api/mcp-tools/log-user-interaction', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              question: userMessage?.content || '',
              answer: message.content,
              session_id: sessionId || `chat-${Date.now()}`,
              metadata: {
                source: 'chat_interface',
                timestamp: new Date().toISOString(),
                sources: sources
              }
            }),
          })

          if (response.ok) {
            const result = await response.json()
            setMessageInteractionIds(prev => ({
              ...prev,
              [message.id]: result.interaction_id
            }))
          }
        } catch (error) {
          console.error('Failed to log interaction:', error)
        }
      }
    },
    onError: (error) => {
      console.error('Chat error:', error)
      
      // Determine error type and provide appropriate feedback
      let errorMessage = 'An error occurred while processing your request.'
      
      if (error.message.includes('web search')) {
        errorMessage = '🌐 Web search is currently unavailable. I\'ll try to answer based on the documents I have access to. For the most current information, please try again later.'
      } else if (error.message.includes('OpenAI')) {
        errorMessage = '🤖 AI service is temporarily unavailable. Please try again in a moment.'
      } else if (error.message.includes('database') || error.message.includes('supabase')) {
        errorMessage = '💾 Database connection issue. Your question couldn\'t be processed. Please try again.'
      } else if (error.message.includes('timeout')) {
        errorMessage = '⏱️ Request timed out. This might be due to high demand or network issues. Please try again.'
      } else if (error.message.includes('rate limit')) {
        errorMessage = '🚦 Too many requests. Please wait a moment before trying again.'
      } else if (error.message.includes('content extraction')) {
        errorMessage = '📄 I had trouble reading some web content, but I\'ll do my best to answer based on available information.'
      }
      
      // Add error message to chat
      const errorChatMessage = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: `❌ ${errorMessage}`,
        createdAt: new Date(),
      }
      setMessages(prev => [...prev, errorChatMessage])
    }
  })

  // Convert messages to our Message type
  const chatMessages: Message[] = messages.map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    sources: messageSources[msg.id] || [], // Get sources from our state
    timestamp: new Date((msg as any).createdAt || Date.now()), // eslint-disable-line @typescript-eslint/no-explicit-any
    isStreaming: false,
    interactionId: messageInteractionIds[msg.id]
  }))

  // Add streaming indicator to the last message if it's loading
  if (isLoading && chatMessages.length > 0) {
    const lastMessage = chatMessages[chatMessages.length - 1]
    if (lastMessage.role === 'assistant') {
      lastMessage.isStreaming = true
    }
  }

  // Check if we should show thinking indicator
  const shouldShowThinking = isLoading && (
    chatMessages.length === 0 || 
    chatMessages[chatMessages.length - 1]?.role === 'user'
  )

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (message: string, useWebSearch?: boolean) => {
    append({ 
      role: 'user', 
      content: message 
    }, {
      body: {
        sessionId,
        useWebSearch: false // Let the backend intelligently decide on data sources
      }
    })
  }

  const handleStopGeneration = () => {
    stop()
  }

  const handleSourceClick = (source: Source) => {
    setSelectedSource(source)
  }

  const handleFeedback = (messageId: string, feedback: number) => {
    // Update the message feedback state locally
    console.log(`Feedback for message ${messageId}: ${feedback}`)
  }

  const clearChat = () => {
    setMessages([])
    setMessageInteractionIds({})
    setMessageSources({})
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Chat Header */}
      <Card className="rounded-b-none border-b-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <CardTitle className="text-lg">Intelligent Assistant</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              disabled={messages.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
          

        </CardHeader>
      </Card>

      {/* Messages Container */}
      <Card className="flex-1 rounded-none border-x-0 border-b-0 overflow-hidden">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {chatMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center p-8">
                <div className="space-y-2">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-medium">Start a conversation</h3>
                  <p className="text-muted-foreground max-w-md">
                    Ask questions about documents you uploaded. I&apos;ll intelligently gather the right data and provide detailed answers with citations.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {chatMessages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onSourceClick={handleSourceClick}
                    onFeedback={handleFeedback}
                  />
                ))}
                
                {/* Show thinking indicator when AI is processing but hasn't started responding */}
                {shouldShowThinking && (
                  <div className="p-4 border-b border-border/50">
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg bg-muted p-3">
                        <ThinkingIndicator />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

                      {/* Chat Input */}
            <ChatInput
              onSendMessage={handleSendMessage}
              onStopGeneration={handleStopGeneration}
              disabled={false}
            isGenerating={isLoading}
          />
        </CardContent>
      </Card>

      {/* Source Preview Modal */}
      {selectedSource && (
        <SourcePreview
          source={selectedSource}
          onClose={() => setSelectedSource(null)}
        />
      )}
    </div>
  )
} 