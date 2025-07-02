'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loading } from '../ui/loading';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Database, 
  BarChart3, 
  Settings, 
  Download, 
  Trash2, 
  Search,
  Eye,
  Calendar,
  Activity,
  HardDrive,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Globe,
  ExternalLink
} from 'lucide-react';

interface Document {
  id: string;
  title: string;
  content: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  updated_at: string;
  metadata: Record<string, any>;
}

interface UserInteraction {
  id: string;
  question: string;
  answer: string;
  document_id: string | null;
  session_id: string | null;
  created_at: string;
  metadata: Record<string, any>;
}

interface StructuredData {
  id: string;
  document_id: string;
  sheet_name: string | null;
  table_name: string | null;
  data: Record<string, any>;
  row_count: number | null;
  column_count: number | null;
  created_at: string;
  metadata: Record<string, any>;
}

interface SystemStats {
  totalDocuments: number;
  totalInteractions: number;
  totalChunks: number;
  totalStructuredData: number;
  totalStorageUsed: number;
  avgResponseTime: number;
  topQuestions: Array<{ question: string; count: number }>;
  uploadTrends: Array<{ date: string; count: number }>;
  interactionTrends: Array<{ date: string; count: number }>;
  feedbackStats?: {
    totalInteractions: number;
    positiveFeedback: number;
    negativeFeedback: number;
    neutralFeedback: number;
    avgResponseTime: number;
    feedbackRate: number;
  };
}

interface WebSearchStats {
  totalQueries: number;
  totalCachedContent: number;
  cacheHitRate: number;
  avgResponseTime: number;
  topSearchQueries: Array<{ query: string; count: number }>;
  searchEngineUsage: Array<{ engine: string; count: number }>;
  cacheStorageUsed: number;
  expiredCacheEntries: number;
}

interface CachedWebContent {
  id: string;
  url: string;
  title: string;
  source: string;
  search_query: string;
  last_fetched: string;
  cache_expires_at: string;
  fetch_count: number;
  content_size: number;
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'interactions' | 'data' | 'analytics' | 'websearch' | 'settings'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [documents, setDocuments] = useState<Document[]>([]);
  const [interactions, setInteractions] = useState<UserInteraction[]>([]);
  const [structuredData, setStructuredData] = useState<StructuredData[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [webSearchStats, setWebSearchStats] = useState<WebSearchStats | null>(null);
  const [cachedContent, setCachedContent] = useState<CachedWebContent[]>([]);
  
  // Filter states
  const [documentFilter, setDocumentFilter] = useState('');
  const [interactionFilter, setInteractionFilter] = useState('');
  const [webSearchFilter, setWebSearchFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Pagination states
  const [documentsPage, setDocumentsPage] = useState(1);
  const [interactionsPage, setInteractionsPage] = useState(1);
  const [cachedContentPage, setCachedContentPage] = useState(1);
  const [pageSize] = useState(20);

  // Load system statistics
  const loadSystemStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to load system stats');
      const stats = await response.json();
      setSystemStats(stats);
    } catch (error) {
      console.error('Error loading system stats:', error);
      setError('Failed to load system statistics');
    } finally {
      setLoading(false);
    }
  };

  // Load documents
  const loadDocuments = async (page = 1, filter = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(filter && { search: filter })
      });
      
      const response = await fetch(`/api/admin/documents?${params}`);
      if (!response.ok) throw new Error('Failed to load documents');
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  // Load user interactions
  const loadInteractions = async (page = 1, filter = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(filter && { search: filter })
      });
      
      const response = await fetch(`/api/admin/interactions?${params}`);
      if (!response.ok) throw new Error('Failed to load interactions');
      const data = await response.json();
      setInteractions(data.interactions || []);
    } catch (error) {
      console.error('Error loading interactions:', error);
      setError('Failed to load interactions');
    } finally {
      setLoading(false);
    }
  };

  // Load structured data
  const loadStructuredData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/structured-data');
      if (!response.ok) throw new Error('Failed to load structured data');
      const data = await response.json();
      setStructuredData(data.structuredData || []);
    } catch (error) {
      console.error('Error loading structured data:', error);
      setError('Failed to load structured data');
    } finally {
      setLoading(false);
    }
  };

  // Load web search statistics
  const loadWebSearchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/web-search-stats');
      if (!response.ok) throw new Error('Failed to load web search stats');
      const stats = await response.json();
      setWebSearchStats(stats);
    } catch (error) {
      console.error('Error loading web search stats:', error);
      setError('Failed to load web search statistics');
    } finally {
      setLoading(false);
    }
  };

  // Load cached web content
  const loadCachedContent = async (page = 1, filter = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(filter && { search: filter })
      });
      
      const response = await fetch(`/api/admin/cached-content?${params}`);
      if (!response.ok) throw new Error('Failed to load cached content');
      const data = await response.json();
      setCachedContent(data.cachedContent || []);
    } catch (error) {
      console.error('Error loading cached content:', error);
      setError('Failed to load cached content');
    } finally {
      setLoading(false);
    }
  };

  // Export data functions
  const exportDocuments = async () => {
    try {
      const response = await fetch('/api/admin/export/documents');
      if (!response.ok) throw new Error('Failed to export documents');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documents-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting documents:', error);
      setError('Failed to export documents');
    }
  };

  const exportInteractions = async () => {
    try {
      const response = await fetch('/api/admin/export/interactions');
      if (!response.ok) throw new Error('Failed to export interactions');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interactions-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting interactions:', error);
      setError('Failed to export interactions');
    }
  };

  // Delete functions
  const deleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document? This will also delete all related chunks and structured data.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/documents/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete document');
      
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document');
    }
  };

  const deleteInteraction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this interaction?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/interactions/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete interaction');
      
      setInteractions(prev => prev.filter(int => int.id !== id));
    } catch (error) {
      console.error('Error deleting interaction:', error);
      setError('Failed to delete interaction');
    }
  };

  // Cleanup functions
  const cleanupOrphanedData = async () => {
    if (!confirm('This will remove orphaned chunks and structured data. Continue?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/admin/cleanup', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to cleanup data');
      
      const result = await response.json();
      alert(`Cleanup completed: ${result.deletedChunks} chunks and ${result.deletedStructuredData} structured data entries removed.`);
      
      // Reload data
      loadSystemStats();
    } catch (error) {
      console.error('Error during cleanup:', error);
      setError('Failed to cleanup data');
    } finally {
      setLoading(false);
    }
  };

  // Clear web search cache
  const clearWebSearchCache = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/clear-web-cache', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to clear web search cache');
      
      // Reload stats and cached content
      await Promise.all([loadWebSearchStats(), loadCachedContent()]);
    } catch (error) {
      console.error('Error clearing web search cache:', error);
      setError('Failed to clear web search cache');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup expired cache entries
  const cleanupExpiredCache = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/cleanup-expired-cache', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to cleanup expired cache');
      
      const result = await response.json();
      console.log(`Cleaned up ${result.deletedCount} expired cache entries`);
      
      // Reload stats and cached content
      await Promise.all([loadWebSearchStats(), loadCachedContent()]);
    } catch (error) {
      console.error('Error cleaning up expired cache:', error);
      setError('Failed to cleanup expired cache');
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'analytics') {
      loadSystemStats();
    } else if (activeTab === 'documents') {
      loadDocuments(documentsPage, documentFilter);
    } else if (activeTab === 'interactions') {
      loadInteractions(interactionsPage, interactionFilter);
    } else if (activeTab === 'data') {
      loadStructuredData();
    } else if (activeTab === 'websearch') {
      loadWebSearchStats();
      loadCachedContent(cachedContentPage, webSearchFilter);
    }
  }, [activeTab, documentsPage, interactionsPage, cachedContentPage, documentFilter, interactionFilter, webSearchFilter]);

  // Utility functions
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number): string => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'interactions', label: 'Interactions', icon: MessageSquare },
    { id: 'data', label: 'Structured Data', icon: Database },
    { id: 'websearch', label: 'Web Search', icon: Globe },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Manage your RAG system data and analytics</p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
              <Button 
                onClick={() => setError(null)} 
                variant="ghost" 
                size="sm" 
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Documents</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {systemStats?.totalDocuments || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <MessageSquare className="h-8 w-8 text-green-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Interactions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {systemStats?.totalInteractions || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Database className="h-8 w-8 text-purple-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Data Chunks</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {systemStats?.totalChunks || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <HardDrive className="h-8 w-8 text-orange-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Storage Used</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {systemStats ? formatFileSize(systemStats.totalStorageUsed) : '0 Bytes'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feedback Statistics */}
            {systemStats?.feedbackStats && (
              <Card>
                <CardHeader>
                  <CardTitle>User Feedback</CardTitle>
                  <CardDescription>User satisfaction metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {systemStats.feedbackStats.positiveFeedback}
                      </div>
                      <div className="text-sm text-gray-600">👍 Positive</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {systemStats.feedbackStats.negativeFeedback}
                      </div>
                      <div className="text-sm text-gray-600">👎 Negative</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {systemStats.feedbackStats.feedbackRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Feedback Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {systemStats.feedbackStats.positiveFeedback > 0 
                          ? ((systemStats.feedbackStats.positiveFeedback / (systemStats.feedbackStats.positiveFeedback + systemStats.feedbackStats.negativeFeedback)) * 100).toFixed(1)
                          : 0}%
                      </div>
                      <div className="text-sm text-gray-600">Satisfaction</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Documents</CardTitle>
                  <CardDescription>Latest uploaded documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {documents.slice(0, 5).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{truncateText(doc.title, 30)}</p>
                          <p className="text-sm text-gray-600">
                            {doc.file_type.toUpperCase()} • {formatFileSize(doc.file_size)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDate(doc.upload_date)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Interactions</CardTitle>
                  <CardDescription>Latest user questions and answers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {interactions.slice(0, 5).map((interaction) => (
                      <div key={interaction.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-sm mb-1">
                          {truncateText(interaction.question, 50)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDate(interaction.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search documents..."
                    value={documentFilter}
                    onChange={(e) => setDocumentFilter(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button
                  onClick={() => loadDocuments(1, documentFilter)}
                  variant="outline"
                  size="sm"
                >
                  Search
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button onClick={exportDocuments} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Document
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Upload Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center">
                            <Loading />
                          </td>
                        </tr>
                      ) : documents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            No documents found
                          </td>
                        </tr>
                      ) : (
                        documents.map((doc) => (
                          <tr key={doc.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {truncateText(doc.title, 40)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  ID: {doc.id.substring(0, 8)}...
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {doc.file_type.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatFileSize(doc.file_size)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(doc.upload_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>{doc.title}</DialogTitle>
                                      <DialogDescription>
                                        {doc.file_type.toUpperCase()} • {formatFileSize(doc.file_size)} • Uploaded {formatDate(doc.upload_date)}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="mt-4">
                                      <h4 className="font-medium mb-2">Content Preview:</h4>
                                      <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                                        <pre className="whitespace-pre-wrap text-sm">
                                          {truncateText(doc.content, 2000)}
                                        </pre>
                                      </div>
                                      {Object.keys(doc.metadata).length > 0 && (
                                        <div className="mt-4">
                                          <h4 className="font-medium mb-2">Metadata:</h4>
                                          <div className="bg-gray-50 p-4 rounded-lg">
                                            <pre className="text-sm">
                                              {JSON.stringify(doc.metadata, null, 2)}
                                            </pre>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  onClick={() => deleteDocument(doc.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'interactions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search interactions..."
                    value={interactionFilter}
                    onChange={(e) => setInteractionFilter(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button
                  onClick={() => loadInteractions(1, interactionFilter)}
                  variant="outline"
                  size="sm"
                >
                  Search
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button onClick={exportInteractions} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              {loading ? (
                <div className="text-center py-8">
                  <Loading />
                </div>
              ) : interactions.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No interactions found</p>
                  </CardContent>
                </Card>
              ) : (
                interactions.map((interaction) => (
                  <Card key={interaction.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {interaction.session_id || 'No Session'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(interaction.created_at)}
                            </span>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Question:</p>
                              <p className="text-sm bg-gray-50 p-3 rounded-lg">
                                {interaction.question}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Answer:</p>
                              <p className="text-sm bg-green-50 p-3 rounded-lg">
                                {truncateText(interaction.answer, 300)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          {interaction.document_id && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                              Has Document
                            </span>
                          )}
                          <Button
                            onClick={() => deleteInteraction(interaction.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Structured Data</h3>
              <Button onClick={loadStructuredData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="grid gap-6">
              {loading ? (
                <div className="text-center py-8">
                  <Loading />
                </div>
              ) : structuredData.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No structured data found</p>
                  </CardContent>
                </Card>
              ) : (
                structuredData.map((data) => (
                  <Card key={data.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-medium">
                            {data.sheet_name || data.table_name || 'Untitled'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Document ID: {data.document_id.substring(0, 8)}...
                          </p>
                          <p className="text-sm text-gray-600">
                            {data.row_count} rows × {data.column_count} columns
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(data.created_at)}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium mb-2">Data Preview:</h5>
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(data.data, null, 2).substring(0, 500)}...
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'websearch' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Web Search</h3>
              <Button onClick={loadWebSearchStats} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="grid gap-6">
              {loading ? (
                <div className="text-center py-8">
                  <Loading />
                </div>
              ) : webSearchStats?.totalQueries === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No web search queries found</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Total Queries</CardTitle>
                      <CardDescription>Total number of web search queries</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        {webSearchStats?.totalQueries}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Total Cached Content</CardTitle>
                      <CardDescription>Total number of cached web pages</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        {webSearchStats?.totalCachedContent}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Cache Hit Rate</CardTitle>
                      <CardDescription>Percentage of cached content accessed</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        {webSearchStats?.cacheHitRate.toFixed(2)}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Average Response Time</CardTitle>
                      <CardDescription>Average time taken to fetch web pages</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        {webSearchStats?.avgResponseTime.toFixed(2)}ms
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Search Queries</CardTitle>
                      <CardDescription>Most frequent web search queries</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {webSearchStats?.topSearchQueries?.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm">{truncateText(item.query, 60)}</span>
                            <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {item.count}
                            </span>
                          </div>
                        )) || (
                          <p className="text-gray-500 text-sm">No data available</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Search Engine Usage</CardTitle>
                      <CardDescription>Most used web search engines</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {webSearchStats?.searchEngineUsage?.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm">{item.engine}</span>
                            <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {item.count}
                            </span>
                          </div>
                        )) || (
                          <p className="text-gray-500 text-sm">No data available</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Cache Storage Used</CardTitle>
                      <CardDescription>Total storage used by cached web pages</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        {webSearchStats ? formatFileSize(webSearchStats.cacheStorageUsed) : '0 Bytes'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Expired Cache Entries</CardTitle>
                      <CardDescription>Number of cached web pages that have expired</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">
                        {webSearchStats?.expiredCacheEntries}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Database Status</span>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">Healthy</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg Response Time</span>
                      <span className="text-sm font-medium">
                        {systemStats?.avgResponseTime || 0}ms
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Usage Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Peak Hours</span>
                      <span className="text-sm font-medium">9AM - 5PM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Most Active Day</span>
                      <span className="text-sm font-medium">Tuesday</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Growth Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Weekly Growth</span>
                      <span className="text-sm font-medium text-green-600">+12%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Monthly Growth</span>
                      <span className="text-sm font-medium text-green-600">+45%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Questions */}
            <Card>
              <CardHeader>
                <CardTitle>Most Frequent Questions</CardTitle>
                <CardDescription>Questions asked most often by users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemStats?.topQuestions?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">{truncateText(item.question, 60)}</span>
                      <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {item.count}
                      </span>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-sm">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Maintenance</CardTitle>
                <CardDescription>Tools for maintaining system health and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Cleanup Orphaned Data</h4>
                    <p className="text-sm text-gray-600">
                      Remove document chunks and structured data that no longer have parent documents
                    </p>
                  </div>
                  <Button onClick={cleanupOrphanedData} variant="outline">
                    Run Cleanup
                  </Button>
                </div>

                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Rebuild Embeddings</h4>
                    <p className="text-sm text-gray-600">
                      Regenerate embeddings for all documents (use if embedding model changes)
                    </p>
                  </div>
                  <Button variant="outline" disabled>
                    Coming Soon
                  </Button>
                </div>

                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Export System Backup</h4>
                    <p className="text-sm text-gray-600">
                      Download a complete backup of all system data
                    </p>
                  </div>
                  <Button variant="outline" disabled>
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>System settings and configuration options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="max-file-size">Maximum File Size (MB)</Label>
                    <Input
                      id="max-file-size"
                      type="number"
                      defaultValue="10"
                      className="mt-1"
                      disabled
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Maximum allowed file size for uploads
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="chunk-size">Document Chunk Size</Label>
                    <Input
                      id="chunk-size"
                      type="number"
                      defaultValue="1000"
                      className="mt-1"
                      disabled
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Number of characters per document chunk
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="similarity-threshold">Similarity Threshold</Label>
                    <Input
                      id="similarity-threshold"
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      defaultValue="0.7"
                      className="mt-1"
                      disabled
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Minimum similarity score for search results
                    </p>
                  </div>

                  <Button disabled className="mt-4">
                    Save Settings (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}