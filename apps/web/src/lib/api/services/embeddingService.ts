import { OpenAIEmbeddings } from '@langchain/openai';
import { dbOperations } from '../supabase';

export interface EmbeddingConfig {
  model: string;
  dimensions: number;
  batchSize: number;
  maxRetries: number;
}

export interface SearchResult {
  id: string;
  contentType: 'chunk' | 'structured';
  content: string;
  documentId: string;
  documentTitle: string;
  similarity: number;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface DocumentSimilarity {
  documentId: string;
  title: string;
  fileType: string;
  similarity: number;
  chunkCount: number;
  structuredDataCount: number;
  createdAt: Date;
}

export interface EmbeddingStats {
  tableName: string;
  totalEmbeddings: number;
  avgSimilarityToCenter: number;
  embeddingDimensions: number;
}

export class EmbeddingService {
  private embeddings: OpenAIEmbeddings | null;
  private config: EmbeddingConfig;

  constructor(config?: Partial<EmbeddingConfig>) {
    this.config = {
      model: config?.model || 'text-embedding-3-small',
      dimensions: config?.dimensions || 1536,
      batchSize: config?.batchSize || 10,
      maxRetries: config?.maxRetries || 3,
    };

    // Only initialize embeddings if API key is available
    this.embeddings = process.env.OPENAI_API_KEY 
      ? new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: this.config.model,
        })
      : null;
  }

  private getEmbeddings(): OpenAIEmbeddings {
    if (!this.embeddings) {
      throw new Error('OpenAI API key not configured');
    }
    return this.embeddings;
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    try {
      const embedding = await this.getEmbeddings().embedQuery(text);
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batches
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    const results: number[][] = [];
    
    for (let i = 0; i < texts.length; i += this.config.batchSize) {
      const batch = texts.slice(i, i + this.config.batchSize);
      
      try {
        const batchEmbeddings = await this.getEmbeddings().embedDocuments(batch);
        results.push(...batchEmbeddings);
      } catch (error) {
        console.error(`Error generating embeddings for batch ${i}-${i + batch.length}:`, error);
        
        // Fallback to individual generation for failed batch
        for (const text of batch) {
          try {
            const embedding = await this.generateEmbedding(text);
            results.push(embedding);
          } catch (individualError) {
            console.error('Failed to generate individual embedding:', individualError);
            // Push zero vector as fallback
            results.push(new Array(this.config.dimensions).fill(0));
          }
        }
      }
    }

    return results;
  }

  /**
   * Generate embedding for structured data
   * Converts structured data to a searchable text representation
   */
  generateStructuredDataText(data: Record<string, any>, sheetName?: string, tableName?: string): string {
    const parts: string[] = [];

    if (sheetName) {
      parts.push(`Sheet: ${sheetName}`);
    }
    
    if (tableName) {
      parts.push(`Table: ${tableName}`);
    }

    // Convert data to searchable text
    if (Array.isArray(data)) {
      // Handle array of objects (typical for table data)
      const textRepresentation = data.map(row => {
        if (typeof row === 'object' && row !== null) {
          return Object.entries(row)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
        }
        return String(row);
      }).join('\n');
      
      parts.push(textRepresentation);
    } else if (typeof data === 'object' && data !== null) {
      // Handle single object
      const textRepresentation = Object.entries(data)
        .map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return `${key}: ${JSON.stringify(value)}`;
          }
          return `${key}: ${value}`;
        })
        .join('\n');
      
      parts.push(textRepresentation);
    } else {
      parts.push(String(data));
    }

    return parts.join('\n\n');
  }

  /**
   * Unified search across both document chunks and structured data
   */
  async unifiedSearch(
    query: string,
    options: {
      matchThreshold?: number;
      matchCount?: number;
      includeChunks?: boolean;
      includeStructured?: boolean;
    } = {}
  ): Promise<SearchResult[]> {
    const {
      matchThreshold = 0.7,
      matchCount = 10,
      includeChunks = true,
      includeStructured = true,
    } = options;

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // Call the unified search function
      const results = await dbOperations.unifiedSimilaritySearch(
        queryEmbedding,
        matchThreshold,
        matchCount,
        includeChunks,
        includeStructured
      );

      return results.map((result: any) => ({
        id: result.id,
        contentType: result.content_type as 'chunk' | 'structured',
        content: result.content,
        documentId: result.document_id,
        documentTitle: result.document_title,
        similarity: result.similarity,
        metadata: result.metadata,
        createdAt: new Date(result.created_at),
      }));
    } catch (error) {
      console.error('Error in unified search:', error);
      throw new Error(`Failed to perform unified search: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find similar documents based on content similarity
   */
  async findSimilarDocuments(
    query: string,
    options: {
      matchThreshold?: number;
      matchCount?: number;
    } = {}
  ): Promise<DocumentSimilarity[]> {
    const {
      matchThreshold = 0.7,
      matchCount = 5,
    } = options;

    try {
      const queryEmbedding = await this.generateEmbedding(query);

      const results = await dbOperations.findSimilarDocuments(
        queryEmbedding,
        matchThreshold,
        matchCount
      );

      return results.map((result: any) => ({
        documentId: result.document_id,
        title: result.title,
        fileType: result.file_type,
        similarity: result.similarity,
        chunkCount: result.chunk_count,
        structuredDataCount: result.structured_data_count,
        createdAt: new Date(result.created_at),
      }));
    } catch (error) {
      console.error('Error finding similar documents:', error);
      throw new Error(`Failed to find similar documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get embedding statistics
   */
  async getEmbeddingStats(): Promise<EmbeddingStats[]> {
    try {
      const results = await dbOperations.getEmbeddingStats();
      
      return results.map((result: any) => ({
        tableName: result.table_name,
        totalEmbeddings: result.total_embeddings,
        avgSimilarityToCenter: result.avg_similarity_to_center,
        embeddingDimensions: result.embedding_dimensions,
      }));
    } catch (error) {
      console.error('Error getting embedding stats:', error);
      
      // Fallback: Return basic stats by querying tables directly
      try {
        return await this.getFallbackEmbeddingStats();
      } catch (fallbackError) {
        console.error('Fallback stats also failed:', fallbackError);
        // Return empty stats rather than throwing
        return [
          {
            tableName: 'document_chunks',
            totalEmbeddings: 0,
            avgSimilarityToCenter: 0,
            embeddingDimensions: 1536,
          },
          {
            tableName: 'structured_data',
            totalEmbeddings: 0,
            avgSimilarityToCenter: 0,
            embeddingDimensions: 1536,
          }
        ];
      }
    }
  }

  /**
   * Fallback method to get basic embedding statistics
   */
  private async getFallbackEmbeddingStats(): Promise<EmbeddingStats[]> {
    const { supabase } = await import('../supabase');
    
    if (!supabase) {
      throw new Error('Supabase client not available');
    }
    
    // Get count of document chunks with embeddings
    const { count: chunkCount } = await supabase
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null);

    // Get count of structured data with embeddings  
    const { count: structuredCount } = await supabase
      .from('structured_data')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null);

    return [
      {
        tableName: 'document_chunks',
        totalEmbeddings: chunkCount || 0,
        avgSimilarityToCenter: 0,
        embeddingDimensions: 1536,
      },
      {
        tableName: 'structured_data',
        totalEmbeddings: structuredCount || 0,
        avgSimilarityToCenter: 0,
        embeddingDimensions: 1536,
      }
    ];
  }

  /**
   * Reprocess embeddings for a document
   */
  async reprocessDocumentEmbeddings(documentId: string): Promise<{
    chunksUpdated: number;
    structuredUpdated: number;
  }> {
    try {
      // Get document chunks that need reprocessing
      const chunks = await dbOperations.getDocumentChunks(documentId);
      const structuredData = await dbOperations.getStructuredData(documentId);

      let chunksUpdated = 0;
      let structuredUpdated = 0;

      // Reprocess chunk embeddings
      if (chunks.length > 0) {
        const chunkTexts = chunks.map((chunk: any) => chunk.content);
        const chunkEmbeddings = await this.generateEmbeddingsBatch(chunkTexts);

        const chunkUpdates = chunks.map((chunk: any, index: number) => ({
          id: chunk.id,
          embedding: chunkEmbeddings[index],
        }));

        chunksUpdated = await dbOperations.batchUpdateChunkEmbeddings(
          documentId,
          chunkUpdates
        );
      }

      // Reprocess structured data embeddings
      if (structuredData.length > 0) {
        const structuredTexts = structuredData.map(item => 
          this.generateStructuredDataText(item.data, item.sheet_name, item.table_name)
        );
        const structuredEmbeddings = await this.generateEmbeddingsBatch(structuredTexts);

        const structuredUpdates = structuredData.map((item, index) => ({
          id: item.id,
          embedding: structuredEmbeddings[index],
        }));

        structuredUpdated = await dbOperations.batchUpdateStructuredEmbeddings(
          documentId,
          structuredUpdates
        );
      }

      return { chunksUpdated, structuredUpdated };
    } catch (error) {
      console.error('Error reprocessing document embeddings:', error);
      throw new Error(`Failed to reprocess embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up orphaned embeddings
   */
  async cleanupOrphanedEmbeddings(): Promise<{
    chunksDeleted: number;
    structuredDeleted: number;
  }> {
    try {
      const result = await dbOperations.cleanupOrphanedEmbeddings();
      
      return {
        chunksDeleted: result.chunks_deleted,
        structuredDeleted: result.structured_deleted,
      };
    } catch (error) {
      console.error('Error cleaning up orphaned embeddings:', error);
      throw new Error(`Failed to cleanup orphaned embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate embedding dimensions
   */
  validateEmbedding(embedding: number[]): boolean {
    return Array.isArray(embedding) && 
           embedding.length === this.config.dimensions &&
           embedding.every(val => typeof val === 'number' && !isNaN(val));
  }

  /**
   * Get configuration
   */
  getConfig(): EmbeddingConfig {
    return { ...this.config };
  }
} 