'use client'

import React, { useState } from 'react'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, FileText } from 'lucide-react'

export default function Phase2TestPage() {
  const [sessionId] = useState(() => `phase2-test-${Date.now()}`)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Phase 2: Hybrid Chat Enhancement Test
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Test the enhanced chat system with web search integration for predictions and real-time information.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Search through uploaded documents using semantic similarity. Perfect for finding specific information from your knowledge base.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Web Search Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Enable real-time web search for latest information and predictions. Great for sports predictions, market trends, and current events.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Test Suggestions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Document Search (Toggle OFF):</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• "What information do you have about [topic from uploaded documents]?"</li>
                  <li>• "Summarize the key points from the documents"</li>
                  <li>• "Find information about [specific term]"</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Web Search (Toggle ON):</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• "What are the latest news about artificial intelligence?"</li>
                  <li>• "Predict the outcome of the next major sporting event"</li>
                  <li>• "What are the current trends in technology?"</li>
                  <li>• "Give me recent information about [current topic]"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <div className="h-[600px] bg-white rounded-2xl shadow-sm overflow-hidden">
          <ChatInterface sessionId={sessionId} className="h-full" />
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="text-gray-600 space-y-2">
              <li>1. <strong>Document Search:</strong> Keep the "Real-time Search" toggle OFF and ask questions about uploaded documents.</li>
              <li>2. <strong>Web Search:</strong> Turn ON the "Real-time Search" toggle and ask for predictions or current information.</li>
              <li>3. <strong>Hybrid Mode:</strong> The system will automatically fall back to web search if no relevant documents are found.</li>
              <li>4. <strong>Source Citations:</strong> Notice how the system cites different types of sources (documents vs web content).</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 