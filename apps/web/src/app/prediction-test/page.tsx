'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Trophy, Brain, Zap } from 'lucide-react'

export default function PredictionTestPage() {
  const [selectedExample, setSelectedExample] = useState<string>('')

  const exampleQueries = [
    {
      category: "Sports Predictions",
      icon: <Trophy className="h-4 w-4" />,
      color: "bg-orange-100 text-orange-800",
      queries: [
        "Who will win the Lakers vs Celtics game tonight?",
        "Predict the score for the next Cowboys vs Giants game",
        "What are the betting odds for Manchester United vs Liverpool?",
        "Will the Warriors cover the spread against the Nuggets?",
        "How many points will LeBron James score in his next game?"
      ]
    },
    {
      category: "General Knowledge",
      icon: <Brain className="h-4 w-4" />,
      color: "bg-blue-100 text-blue-800",
      queries: [
        "What's the latest news about artificial intelligence?",
        "Summarize recent market trends in technology stocks",
        "What are the current developments in renewable energy?",
        "Search for information about climate change policies",
        "What's happening in the cryptocurrency market?"
      ]
    },
    {
      category: "Document Analysis",
      icon: <Zap className="h-4 w-4" />,
      color: "bg-green-100 text-green-800",
      queries: [
        "Analyze the financial data in my uploaded documents",
        "What are the key insights from the quarterly report?",
        "Summarize the main points from the research paper",
        "Extract action items from the meeting notes",
        "What are the recommendations in the strategy document?"
      ]
    }
  ]

  const handleExampleClick = (query: string) => {
    setSelectedExample(query)
    // The query will be automatically sent to the chat interface
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Phase 2: Intelligent Data Orchestration</h1>
          <p className="text-muted-foreground text-lg">
            Test the enhanced prediction capabilities with automatic data source orchestration
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Example Queries Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Example Queries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {exampleQueries.map((category) => (
                  <div key={category.category}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={category.color}>
                        {category.icon}
                        <span className="ml-1">{category.category}</span>
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {category.queries.map((query, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full text-left justify-start h-auto p-3 text-xs"
                          onClick={() => handleExampleClick(query)}
                        >
                          {query}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />
                  <p><strong>Intent Detection:</strong> AI analyzes your query to determine if you want sports predictions, general information, or document analysis</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                  <p><strong>Data Orchestration:</strong> Automatically fetches from sports APIs, web search, or document databases based on your intent</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                  <p><strong>Expert Analysis:</strong> Provides confident predictions with sources and confidence scores</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[800px]">
              <CardContent className="p-0 h-full">
                <ChatInterface 
                  className="h-full"
                  sessionId={`prediction-test-${Date.now()}`}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4 text-orange-500" />
                Sports Predictions
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              <ul className="space-y-1">
                <li>• Real-time game schedules</li>
                <li>• Live betting odds</li>
                <li>• Team & player statistics</li>
                <li>• Expert news analysis</li>
                <li>• Confidence scoring</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-500" />
                Web Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              <ul className="space-y-1">
                <li>• Current news & trends</li>
                <li>• Market analysis</li>
                <li>• Real-time information</li>
                <li>• Expert opinions</li>
                <li>• Source verification</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                Document Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              <ul className="space-y-1">
                <li>• Semantic search</li>
                <li>• Content summarization</li>
                <li>• Key insight extraction</li>
                <li>• Citation tracking</li>
                <li>• Context understanding</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 