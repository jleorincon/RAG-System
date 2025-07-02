'use client'

import React, { useState } from 'react'
import { DocumentUpload } from '@/components/upload/DocumentUpload'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { EmbeddingDashboard } from '@/components/embedding/EmbeddingDashboard'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { Button } from '@/components/ui/button'
import { FileText, MessageSquare, Upload, Sparkles, Database, Settings, TrendingUp, Search, Zap, Shield, BarChart3, Bot } from 'lucide-react'
import Image from 'next/image'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'upload' | 'chat' | 'embeddings' | 'admin'>('chat')
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9))

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
    
    // Switch to chat tab after successful upload
    setActiveTab('chat')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                <Image 
                  src="/lock-logo.svg" 
                  alt="RAG System Logo" 
                  width={32} 
                  height={32} 
                  className="text-white filter brightness-0 invert"
                />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                RAG System
              </h1>
            </div>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Intelligent document analysis and search by advanced AI. Upload documents to retrieve relevant information using AI.
            </p>
            
            {/* Quick Stats */}
            <div className="flex justify-center items-center gap-8 mt-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-blue-600" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                <span>Real-time</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-2">
              <Button
                variant={activeTab === 'upload' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'upload' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Upload className="h-4 w-4" />
                Upload Documents
              </Button>
              <Button
                variant={activeTab === 'chat' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'chat' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </Button>
              <Button
                variant={activeTab === 'embeddings' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('embeddings')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'embeddings' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Database className="h-4 w-4" />
                Embeddings
              </Button>
              <Button
                variant={activeTab === 'admin' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'admin' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Settings className="h-4 w-4" />
                Admin
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="w-full">
            {activeTab === 'upload' ? (
              <div className="space-y-12">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                  <DocumentUpload onUpload={handleUpload} />
                </div>
                
                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="group text-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Multiple Formats</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Support for PDF, DOCX, TXT, and Markdown files with intelligent content extraction
                    </p>
                  </div>
                  
                  <div className="group text-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">AI-Powered Analysis</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Advanced embeddings and semantic search for accurate summaries of uploaded documents
                    </p>
                  </div>
                  
                  <div className="group text-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Search className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Source Citations</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Every summary and analysis includes detailed references from uploaded documents and data
                    </p>
                  </div>
                </div>
              </div>
            ) : activeTab === 'chat' ? (
              <div className="h-[700px] bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                <div className="h-full relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                  <ChatInterface sessionId={sessionId} className="h-full" />
                </div>
              </div>
            ) : activeTab === 'embeddings' ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                <EmbeddingDashboard />
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                <AdminDashboard />
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
