'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loading } from '../ui/loading';

interface EmbeddingStats {
  tableName: string;
  totalEmbeddings: number;
  avgSimilarityToCenter: number;
  embeddingDimensions: number;
}

interface SearchResult {
  id: string;
  contentType: 'chunk' | 'structured';
  content: string;
  documentId: string;
  documentTitle: string;
  similarity: number;
  metadata: Record<string, any>;
  createdAt: Date;
}

interface DocumentSimilarity {
  documentId: string;
  title: string;
  fileType: string;
  similarity: number;
  chunkCount: number;
  structuredDataCount: number;
  createdAt: Date;
}

export function EmbeddingDashboard() {
  const [stats, setStats] = useState<EmbeddingStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [similarDocuments, setSimilarDocuments] = useState<DocumentSimilarity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load stats on component mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/embeddings?action=stats');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load stats');
      }
    } catch (err) {
      setError('Failed to load embedding statistics');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        action: 'search',
        query: searchQuery,
        limit: '10',
        threshold: '0.7',
      });

      const response = await fetch(`/api/embeddings?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setSearchResults(data.results);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      setError('Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const findSimilarDocuments = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        action: 'similar-documents',
        query: searchQuery,
        limit: '5',
        threshold: '0.7',
      });

      const response = await fetch(`/api/embeddings?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setSimilarDocuments(data.documents);
      } else {
        setError(data.error || 'Document similarity search failed');
      }
    } catch (err) {
      setError('Failed to find similar documents');
    } finally {
      setLoading(false);
    }
  };

  const cleanupEmbeddings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cleanup' }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`Cleanup completed: ${data.result.chunksDeleted} chunks and ${data.result.structuredDeleted} structured data items deleted`);
        loadStats(); // Reload stats
      } else {
        setError(data.error || 'Cleanup failed');
      }
    } catch (err) {
      setError('Failed to cleanup embeddings');
    } finally {
      setLoading(false);
    }
  };

  const formatSimilarity = (similarity: number) => {
    return (similarity * 100).toFixed(1) + '%';
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Embedding Dashboard</h2>
        <Button onClick={cleanupEmbeddings} disabled={loading} variant="outline">
          Cleanup Orphaned Embeddings
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Embedding Statistics</CardTitle>
          <CardDescription>Overview of embeddings in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && stats.length === 0 ? (
            <Loading />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div key={stat.tableName} className="p-4 border rounded-lg">
                  <h3 className="font-semibold capitalize">
                    {stat.tableName.replace('_', ' ')}
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {stat.totalEmbeddings.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {stat.embeddingDimensions} dimensions
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Semantic Search</CardTitle>
          <CardDescription>Search across document chunks and structured data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search-query">Search Query</Label>
              <Input
                id="search-query"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter your search query..."
                onKeyDown={(e) => e.key === 'Enter' && performSearch()}
              />
            </div>
            <div className="flex flex-col justify-end gap-2">
              <Button onClick={performSearch} disabled={loading || !searchQuery.trim()}>
                Search Content
              </Button>
              <Button 
                onClick={findSimilarDocuments} 
                disabled={loading || !searchQuery.trim()}
                variant="outline"
              >
                Find Similar Docs
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Search Results</h3>
              {searchResults.map((result) => (
                <div key={result.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {result.documentTitle}
                    </span>
                    <div className="flex gap-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {result.contentType}
                      </span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {formatSimilarity(result.similarity)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {truncateText(result.content)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Similar Documents */}
          {similarDocuments.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Similar Documents</h3>
              {similarDocuments.map((doc) => (
                <div key={doc.documentId} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{doc.title}</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {formatSimilarity(doc.similarity)}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-600">
                    <span>Type: {doc.fileType}</span>
                    <span>Chunks: {doc.chunkCount}</span>
                    <span>Structured: {doc.structuredDataCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 