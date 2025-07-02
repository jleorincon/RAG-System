'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Loading } from '../ui/loading';
import { ErrorMessage } from '../ui/error-message';

interface SearchResult {
  id: string;
  contentType: 'chunk' | 'structured';
  content: string;
  documentId: string;
  documentTitle: string;
  similarity: number;
  metadata: Record<string, any>;
  createdAt: string;
}

interface Phase3TestResponse {
  success: boolean;
  query: string;
  queryEmbedding: {
    dimensions: number;
    preview: number[];
  };
  searchOptions: {
    matchThreshold: number;
    matchCount: number;
    includeChunks: boolean;
    includeStructured: boolean;
  };
  results: {
    unified: {
      count: number;
      results: SearchResult[];
    };
    directChunks: {
      count: number;
      results: any[];
    };
    directStructured: {
      count: number;
      results: any[];
    };
  };
  embeddingStats: Array<{
    tableName: string;
    totalEmbeddings: number;
    avgSimilarityToCenter: number;
    embeddingDimensions: number;
  }>;
  timestamp: string;
}

export function Phase3TestInterface() {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(5);
  const [threshold, setThreshold] = useState(0.7);
  const [includeChunks, setIncludeChunks] = useState(true);
  const [includeStructured, setIncludeStructured] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Phase3TestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/phase3-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit,
          threshold,
          includeChunks,
          includeStructured,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to perform search');
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatSimilarity = (similarity: number) => {
    return (similarity * 100).toFixed(1) + '%';
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Phase 3: Vector Search Test</h1>
        <p className="text-gray-600">Test semantic search using vector similarity in Supabase</p>
      </div>

      {/* Search Form */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="query">Search Query</Label>
            <Input
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your search query (e.g., 'What is artificial intelligence?')"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="limit">Results Limit</Label>
              <Input
                id="limit"
                type="number"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 5)}
                min="1"
                max="20"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="threshold">Similarity Threshold</Label>
              <Input
                id="threshold"
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value) || 0.7)}
                min="0"
                max="1"
                step="0.1"
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <input
                id="includeChunks"
                type="checkbox"
                checked={includeChunks}
                onChange={(e) => setIncludeChunks(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="includeChunks">Include Chunks</Label>
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <input
                id="includeStructured"
                type="checkbox"
                checked={includeStructured}
                onChange={(e) => setIncludeStructured(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="includeStructured">Include Structured</Label>
            </div>
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={loading}
            className="w-full"
          >
            {loading ? <Loading size="sm" className="mr-2" /> : null}
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </Card>

      {/* Error Display */}
      {error && <ErrorMessage message={error} />}

      {/* Results Display */}
      {results && (
        <div className="space-y-6">
          {/* Query Info */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-2">Query Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Query:</strong> {results.query}
              </div>
              <div>
                <strong>Embedding Dimensions:</strong> {results.queryEmbedding.dimensions}
              </div>
              <div>
                <strong>Similarity Threshold:</strong> {results.searchOptions.matchThreshold}
              </div>
              <div>
                <strong>Max Results:</strong> {results.searchOptions.matchCount}
              </div>
            </div>
            <div className="mt-2">
              <strong>Embedding Preview:</strong> [{results.queryEmbedding.preview.map(v => v.toFixed(4)).join(', ')}...]
            </div>
          </Card>

          {/* Embedding Statistics */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-2">Database Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {results.embeddingStats.map((stat, index) => (
                <div key={index} className="text-center p-3 bg-gray-50 rounded">
                  <div className="font-semibold">{stat.tableName}</div>
                  <div className="text-2xl font-bold text-blue-600">{stat.totalEmbeddings.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">embeddings</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Unified Search Results */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">
              Unified Search Results ({results.results.unified.count} found)
            </h3>
            <div className="space-y-4">
              {results.results.unified.results.map((result, index) => (
                <div key={result.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {result.contentType}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        {formatSimilarity(result.similarity)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {result.documentTitle}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 mb-2">
                    {truncateContent(result.content)}
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {result.id} | Document: {result.documentId}
                  </div>
                </div>
              ))}
              {results.results.unified.count === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No results found. Try lowering the similarity threshold or checking if documents are uploaded.
                </div>
              )}
            </div>
          </Card>

          {/* Direct Results Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">
                Direct Chunk Search ({results.results.directChunks.count} found)
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.results.directChunks.results.map((result, index) => (
                  <div key={index} className="text-sm border-l-4 border-blue-500 pl-3 py-2">
                    <div className="font-medium">Similarity: {formatSimilarity(result.similarity)}</div>
                    <div className="text-gray-600">{truncateContent(result.content, 100)}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">
                Direct Structured Search ({results.results.directStructured.count} found)
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.results.directStructured.results.map((result, index) => (
                  <div key={index} className="text-sm border-l-4 border-purple-500 pl-3 py-2">
                    <div className="font-medium">Similarity: {formatSimilarity(result.similarity)}</div>
                    <div className="text-gray-600">
                      {result.table_name || result.sheet_name || 'Table Data'}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 