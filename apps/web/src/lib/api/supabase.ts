import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Runtime validation function
function validateSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
}

// Client for public operations (using anon key)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Admin client for service operations (using service role key)
export const supabaseAdmin = supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey)
  ? createClient(
      supabaseUrl,
      (supabaseServiceRoleKey || supabaseAnonKey)!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null;

// Database types for TypeScript
export interface Document {
  id: string;
  title: string;
  content: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  embedding: number[] | null;
  token_count: number;
  created_at: string;
  metadata: Record<string, any>;
}

export interface StructuredData {
  id: string;
  document_id: string;
  sheet_name: string | null;
  table_name: string | null;
  data: Record<string, any>;
  embedding: number[] | null;
  row_count: number | null;
  column_count: number | null;
  created_at: string;
  metadata: Record<string, any>;
}

// Helper functions for database operations
export const dbOperations = {
  // Insert a new document
  async insertDocument(document: Omit<Document, 'id' | 'upload_date' | 'updated_at'>) {
    validateSupabaseConfig();
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('documents')
      .insert(document)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Insert document chunks with embeddings
  async insertDocumentChunks(chunks: Omit<DocumentChunk, 'id' | 'created_at'>[]) {
    validateSupabaseConfig();
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('document_chunks')
      .insert(chunks)
      .select();
    
    if (error) throw error;
    return data;
  },

  // Get all documents
  async getDocuments() {
    validateSupabaseConfig();
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('upload_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get document by ID with its chunks
  async getDocumentWithChunks(documentId: string) {
    validateSupabaseConfig();
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        document_chunks (*)
      `)
      .eq('id', documentId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Search for similar document chunks using vector similarity
  async searchSimilarChunks(embedding: number[], limit: number = 5, threshold: number = 0.8) {
    validateSupabaseConfig();
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase.rpc('match_document_chunks', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit
    });
    
    if (error) throw error;
    return data;
  },

  // Delete a document and its chunks
  async deleteDocument(documentId: string) {
    validateSupabaseConfig();
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);
    
    if (error) throw error;
  },

  // Insert structured data with embeddings
  async insertStructuredData(structuredData: Omit<StructuredData, 'id' | 'created_at'>[]) {
    validateSupabaseConfig();
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('structured_data')
      .insert(structuredData)
      .select();
    
    if (error) throw error;
    return data;
  },

  // Get structured data by document ID
  async getStructuredDataByDocument(documentId: string) {
    validateSupabaseConfig();
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('structured_data')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Search for similar structured data using vector similarity
  async searchSimilarStructuredData(embedding: number[], limit: number = 5, threshold: number = 0.8) {
    validateSupabaseConfig();
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase.rpc('match_structured_data', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit
    });
    
    if (error) throw error;
    return data;
  },

  // Unified search across both document chunks and structured data
  async unifiedSimilaritySearch(
    embedding: number[], 
    matchThreshold: number = 0.7, 
    matchCount: number = 10,
    includeChunks: boolean = true,
    includeStructured: boolean = true
  ) {
    validateSupabaseConfig();
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase.rpc('unified_similarity_search', {
      query_embedding: embedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      include_chunks: includeChunks,
      include_structured: includeStructured
    });
    
    if (error) throw error;
    return data;
  },

  // Find similar documents based on content similarity
  async findSimilarDocuments(
    embedding: number[], 
    matchThreshold: number = 0.7, 
    matchCount: number = 5
  ) {
    validateSupabaseConfig();
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase.rpc('find_similar_documents', {
      query_embedding: embedding,
      match_threshold: matchThreshold,
      match_count: matchCount
    });
    
    if (error) throw error;
    return data;
  },

  // Get embedding statistics
  async getEmbeddingStats() {
    validateSupabaseConfig();
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase.rpc('get_embedding_stats');
    
    if (error) throw error;
    return data;
  },

  // Get document chunks for a specific document
  async getDocumentChunks(documentId: string) {
    validateSupabaseConfig();
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('document_id', documentId)
      .order('chunk_index', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Get structured data for a specific document
  async getStructuredData(documentId: string) {
    validateSupabaseConfig();
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('structured_data')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Batch update chunk embeddings
  async batchUpdateChunkEmbeddings(
    documentId: string, 
    chunkUpdates: { id: string; embedding: number[] }[]
  ) {
    validateSupabaseConfig();
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase.rpc('batch_update_chunk_embeddings', {
      document_id_param: documentId,
      chunk_embeddings: chunkUpdates
    });
    
    if (error) throw error;
    return data || 0;
  },

  // Batch update structured data embeddings
  async batchUpdateStructuredEmbeddings(
    documentId: string, 
    structuredUpdates: { id: string; embedding: number[] }[]
  ) {
    validateSupabaseConfig();
    if (!supabase) throw new Error('Supabase client not initialized');
    
    let updatedCount = 0;
    
    // Update each structured data item individually since we don't have a batch function for it
    for (const update of structuredUpdates) {
      const { error } = await supabase
        .from('structured_data')
        .update({ embedding: update.embedding })
        .eq('id', update.id)
        .eq('document_id', documentId);
      
      if (!error) {
        updatedCount++;
      }
    }
    
    return updatedCount;
  },

  // Clean up orphaned embeddings
  async cleanupOrphanedEmbeddings() {
    validateSupabaseConfig();
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase.rpc('cleanup_orphaned_embeddings');
    
    if (error) throw error;
    return data;
  }
}; 