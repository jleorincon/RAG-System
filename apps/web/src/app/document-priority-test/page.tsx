'use client'

import React, { useState } from 'react'
import { DocumentUpload } from '@/components/upload/DocumentUpload'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, MessageSquare, Upload, CheckCircle, AlertTriangle, Info } from 'lucide-react'

export default function DocumentPriorityTestPage() {
  const [sessionId] = useState(() => `doc-priority-test-${Date.now()}`)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'upload' | 'chat'>('upload')

  const handleUpload = async (files: File[]) => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const result = await response.json()
    console.log('Upload result:', result)
    
    // Track uploaded file names
    const newFileNames = result.results
      .filter((r: any) => r.success)
      .map((r: any) => r.filename)
    
    setUploadedFiles(prev => [...prev, ...newFileNames])
    
    // Switch to chat tab after successful upload
    setActiveTab('chat')
  }

  const exampleQueries = [
    {
      category: "Document-Specific Queries",
      description: "These queries should prioritize your uploaded documents",
      color: "bg-green-100 text-green-800",
      queries: [
        "What are the main topics covered in the uploaded documents?",
        "Summarize the key findings from my documents",
        "What recommendations are mentioned in the files?",
        "Extract the most important data points from the documents",
        "What conclusions can you draw from the uploaded content?"
      ]
    },
    {
      category: "Mixed Queries",
      description: "These should use documents first, then supplement with web search if needed",
      color: "bg-blue-100 text-blue-800",
      queries: [
        "How does the information in my documents compare to current trends?",
        "What additional context can you provide about topics in my files?",
        "Are there any recent developments related to the content in my documents?",
        "Combine insights from my documents with current market data",
        "What external sources support or contradict my document findings?"
      ]
    },
    {
      category: "General Queries",
      description: "These should fall back to web search since they're not document-specific",
      color: "bg-orange-100 text-orange-800",
      queries: [
        "What's the latest news in artificial intelligence?",
        "What are current stock market trends?",
        "Tell me about recent scientific discoveries",
        "What's happening in climate change research?",
        "What are the latest technology developments?"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Document Priority System Test
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Test the enhanced chat system that prioritizes uploaded documents when answering questions. 
            Upload documents first, then ask questions to see how the system prioritizes your content.
          </p>
        </div>

        {/* Status */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upload Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${uploadedFiles.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm">
                    {uploadedFiles.length > 0 ? `${uploadedFiles.length} documents uploaded` : 'No documents uploaded'}
                  </span>
                </div>
                {uploadedFiles.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Ready for prioritized search
                  </Badge>
                )}
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  Files: {uploadedFiles.join(', ')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'upload' ? 'default' : 'outline'}
            onClick={() => setActiveTab('upload')}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Documents
          </Button>
          <Button
            variant={activeTab === 'chat' ? 'default' : 'outline'}
            onClick={() => setActiveTab('chat')}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Test Chat
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'upload' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Test Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <DocumentUpload onUpload={handleUpload} />
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[700px]">
                <CardContent className="p-0 h-full">
                  <ChatInterface 
                    className="h-full"
                    sessionId={sessionId}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  How Document Priority Works
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Step 1: High-Quality Search</p>
                    <p className="text-gray-600">Searches uploaded documents with strict similarity threshold (0.5+)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Step 2: Priority Decision</p>
                    <p className="text-gray-600">If good matches found (60%+ similarity), prioritizes uploaded content</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Step 3: Supplementation</p>
                    <p className="text-gray-600">Only adds web search if uploaded docs don't fully answer the question</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Suggestions */}
            <div className="space-y-4">
              {exampleQueries.map((category, categoryIndex) => (
                <Card key={categoryIndex}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{category.category}</CardTitle>
                      <Badge className={category.color} variant="secondary">
                        {category.queries.length} examples
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{category.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {category.queries.map((query, queryIndex) => (
                        <Button
                          key={queryIndex}
                          variant="ghost"
                          size="sm"
                          className="w-full text-left justify-start h-auto p-2 text-xs"
                          onClick={() => {
                            setActiveTab('chat')
                            // You could also auto-fill the chat input here
                          }}
                        >
                          "{query}"
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Expected Behavior */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Expected Behavior</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="p-2 bg-green-50 rounded border-l-2 border-green-500">
                  <p className="font-medium text-green-800">✓ Document-specific queries</p>
                  <p className="text-green-700">Should show "UPLOADED DOCUMENTS (HIGHEST PRIORITY)" in sources</p>
                </div>
                <div className="p-2 bg-blue-50 rounded border-l-2 border-blue-500">
                  <p className="font-medium text-blue-800">~ Mixed queries</p>
                  <p className="text-blue-700">Should combine uploaded docs with web search as supplementary</p>
                </div>
                <div className="p-2 bg-orange-50 rounded border-l-2 border-orange-500">
                  <p className="font-medium text-orange-800">→ General queries</p>
                  <p className="text-orange-700">Should fall back to web search when no relevant docs found</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 