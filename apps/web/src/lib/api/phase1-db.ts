import { createClient } from '@supabase/supabase-js';
import { Phase1Document, Phase1Embedding, EmbeddingMatch, NewDocument, NewEmbedding } from './phase1-types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Phase 1 Database Operations
export const phase1DB = {
  // Insert a new document
  async insertDocument(document: NewDocument): Promise<Phase1Document> {
    const { data, error } = await supabase
      .from('documents')
      .insert(document)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Insert an embedding
  async insertEmbedding(embedding: NewEmbedding): Promise<Phase1Embedding> {
    const { data, error } = await supabase
      .from('embeddings')
      .insert(embedding)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get all documents
  async getDocuments(): Promise<Phase1Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get document by ID
  async getDocument(id: string): Promise<Phase1Document | null> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },

  // Get embeddings for a document
  async getEmbeddingsForDocument(documentId: string): Promise<Phase1Embedding[]> {
    const { data, error } = await supabase
      .from('embeddings')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Search for similar embeddings using vector similarity
  async searchSimilarEmbeddings(
    queryEmbedding: number[], 
    threshold: number = 0.8, 
    limit: number = 5
  ): Promise<EmbeddingMatch[]> {
    const { data, error } = await supabase.rpc('match_embeddings', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit
    });
    
    if (error) throw error;
    return data || [];
  },

  // Delete a document and its embeddings
  async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Update document
  async updateDocument(id: string, updates: Partial<NewDocument>): Promise<Phase1Document> {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get document with its embeddings
  async getDocumentWithEmbeddings(id: string) {
    const [document, embeddings] = await Promise.all([
      this.getDocument(id),
      this.getEmbeddingsForDocument(id)
    ]);

    return {
      document,
      embeddings
    };
  }
}; 