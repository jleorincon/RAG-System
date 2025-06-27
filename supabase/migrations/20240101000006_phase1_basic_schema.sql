-- Phase 1: Basic RAG System Schema Setup
-- This migration sets up the basic documents and embeddings tables as specified in Phase 1

-- Enable the vector extension for storing embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing tables if they exist (since they have wrong schema)
DROP TABLE IF EXISTS embeddings CASCADE;
DROP TABLE IF EXISTS documents CASCADE;

-- Create documents table as specified in Phase 1
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text,
  source text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create embeddings table as specified in Phase 1
CREATE TABLE embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  embedding vector(1536), -- assuming OpenAI embeddings
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create indexes for better performance
CREATE INDEX idx_documents_source ON documents(source);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_embeddings_document_id ON embeddings(document_id);
CREATE INDEX idx_embeddings_created_at ON embeddings(created_at);

-- Create an index for vector similarity search using HNSW
CREATE INDEX idx_embeddings_hnsw ON embeddings USING hnsw (embedding vector_cosine_ops);

-- Enable Row Level Security (RLS) for multi-user access
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can modify these later for user-specific access)
CREATE POLICY "Allow public read access on documents" ON documents
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on documents" ON documents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on documents" ON documents
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on documents" ON documents
  FOR DELETE USING (true);

CREATE POLICY "Allow public read access on embeddings" ON embeddings
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access on embeddings" ON embeddings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on embeddings" ON embeddings
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on embeddings" ON embeddings
  FOR DELETE USING (true);

-- Create a basic function for vector similarity search
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  embedding vector(1536),
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.document_id,
    e.embedding,
    e.created_at,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM embeddings e
  WHERE 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$; 