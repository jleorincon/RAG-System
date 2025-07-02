// Phase 1 Basic Schema Types
// These types match the simple documents and embeddings tables from Phase 1

export interface Phase1Document {
  id: string;
  content: string | null;
  source: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface Phase1Embedding {
  id: string;
  document_id: string;
  embedding: number[] | null;
  created_at: string;
}

// Response type for vector similarity search
export interface EmbeddingMatch {
  id: string;
  document_id: string;
  embedding: number[];
  created_at: string;
  similarity: number;
}

// Helper type for inserting new documents
export type NewDocument = Omit<Phase1Document, 'id' | 'created_at'>;

// Helper type for inserting new embeddings
export type NewEmbedding = Omit<Phase1Embedding, 'id' | 'created_at'>; 