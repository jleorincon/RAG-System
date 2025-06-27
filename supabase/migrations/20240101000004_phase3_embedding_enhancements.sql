-- Phase 3: Enhanced Embedding & Search Migration
-- This migration optimizes vector indexes and adds enhanced search functions

-- Optimize vector indexes for better performance
-- Drop existing indexes if they exist and recreate with better parameters
DROP INDEX IF EXISTS idx_document_chunks_embedding;
DROP INDEX IF EXISTS idx_structured_data_embedding;

-- Create optimized vector indexes
-- For document chunks - using more lists for better performance with larger datasets
CREATE INDEX idx_document_chunks_embedding ON document_chunks 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- For structured data - using more lists for better performance
CREATE INDEX idx_structured_data_embedding ON structured_data 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Add additional indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_document_chunks_created_at ON document_chunks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_structured_data_created_at ON structured_data(created_at DESC);

-- Create a unified search function that searches both document chunks and structured data
CREATE OR REPLACE FUNCTION unified_similarity_search(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  include_chunks boolean DEFAULT true,
  include_structured boolean DEFAULT true
)
RETURNS TABLE (
  id uuid,
  content_type text,
  content text,
  document_id uuid,
  document_title text,
  similarity float,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH chunk_results AS (
    SELECT 
      dc.id,
      'chunk'::text as content_type,
      dc.content,
      dc.document_id,
      d.title as document_title,
      1 - (dc.embedding <=> query_embedding) AS similarity,
      dc.metadata,
      dc.created_at
    FROM document_chunks dc
    JOIN documents d ON dc.document_id = d.id
    WHERE include_chunks = true
      AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ),
  structured_results AS (
    SELECT 
      sd.id,
      'structured'::text as content_type,
      COALESCE(sd.table_name, sd.sheet_name, 'Table Data') || ': ' || sd.data::text as content,
      sd.document_id,
      d.title as document_title,
      1 - (sd.embedding <=> query_embedding) AS similarity,
      sd.metadata,
      sd.created_at
    FROM structured_data sd
    JOIN documents d ON sd.document_id = d.id
    WHERE include_structured = true
      AND 1 - (sd.embedding <=> query_embedding) > match_threshold
  ),
  combined_results AS (
    SELECT * FROM chunk_results
    UNION ALL
    SELECT * FROM structured_results
  )
  SELECT 
    cr.id,
    cr.content_type,
    cr.content,
    cr.document_id,
    cr.document_title,
    cr.similarity,
    cr.metadata,
    cr.created_at
  FROM combined_results cr
  ORDER BY cr.similarity DESC
  LIMIT match_count;
END;
$$;

-- Enhanced function to get embedding statistics
CREATE OR REPLACE FUNCTION get_embedding_stats()
RETURNS TABLE (
  table_name text,
  total_embeddings bigint,
  avg_similarity_to_center float,
  embedding_dimensions int
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'document_chunks'::text,
    COUNT(*)::bigint,
    0.0::float, -- Placeholder for now
    1536::int
  FROM document_chunks 
  WHERE embedding IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'structured_data'::text,
    COUNT(*)::bigint,
    0.0::float, -- Placeholder for now
    1536::int
  FROM structured_data 
  WHERE embedding IS NOT NULL;
END;
$$;

-- Function to find similar documents based on document-level embeddings
CREATE OR REPLACE FUNCTION find_similar_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  document_id uuid,
  title text,
  file_type text,
  similarity float,
  chunk_count bigint,
  structured_data_count bigint,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH document_similarities AS (
    SELECT 
      d.id as document_id,
      d.title,
      d.file_type,
      AVG(1 - (dc.embedding <=> query_embedding)) as avg_similarity,
      COUNT(dc.id) as chunk_count,
      d.upload_date as created_at
    FROM documents d
    JOIN document_chunks dc ON d.id = dc.document_id
    WHERE dc.embedding IS NOT NULL
    GROUP BY d.id, d.title, d.file_type, d.upload_date
    HAVING AVG(1 - (dc.embedding <=> query_embedding)) > match_threshold
  ),
  structured_counts AS (
    SELECT 
      document_id,
      COUNT(*) as structured_count
    FROM structured_data
    GROUP BY document_id
  )
  SELECT 
    ds.document_id,
    ds.title,
    ds.file_type,
    ds.avg_similarity as similarity,
    ds.chunk_count,
    COALESCE(sc.structured_count, 0) as structured_data_count,
    ds.created_at
  FROM document_similarities ds
  LEFT JOIN structured_counts sc ON ds.document_id = sc.document_id
  ORDER BY ds.avg_similarity DESC
  LIMIT match_count;
END;
$$;

-- Function to batch update embeddings (useful for reprocessing)
CREATE OR REPLACE FUNCTION batch_update_chunk_embeddings(
  document_id_param uuid,
  chunk_embeddings jsonb
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count int := 0;
  chunk_data jsonb;
BEGIN
  FOR chunk_data IN SELECT jsonb_array_elements(chunk_embeddings)
  LOOP
    UPDATE document_chunks 
    SET embedding = (chunk_data->>'embedding')::vector(1536)
    WHERE id = (chunk_data->>'id')::uuid 
      AND document_id = document_id_param;
    
    IF FOUND THEN
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN updated_count;
END;
$$;

-- Add some helpful views for monitoring embedding performance
CREATE OR REPLACE VIEW embedding_coverage AS
SELECT 
  'document_chunks' as table_name,
  COUNT(*) as total_rows,
  COUNT(embedding) as rows_with_embeddings,
  ROUND((COUNT(embedding)::float / COUNT(*) * 100), 2) as coverage_percentage
FROM document_chunks
UNION ALL
SELECT 
  'structured_data' as table_name,
  COUNT(*) as total_rows,
  COUNT(embedding) as rows_with_embeddings,
  ROUND((COUNT(embedding)::float / COUNT(*) * 100), 2) as coverage_percentage
FROM structured_data;

-- Create a function to cleanup orphaned embeddings
CREATE OR REPLACE FUNCTION cleanup_orphaned_embeddings()
RETURNS TABLE (
  chunks_deleted int,
  structured_deleted int
)
LANGUAGE plpgsql
AS $$
DECLARE
  chunks_count int;
  structured_count int;
BEGIN
  -- Delete orphaned document chunks
  WITH deleted_chunks AS (
    DELETE FROM document_chunks dc
    WHERE NOT EXISTS (
      SELECT 1 FROM documents d WHERE d.id = dc.document_id
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO chunks_count FROM deleted_chunks;
  
  -- Delete orphaned structured data
  WITH deleted_structured AS (
    DELETE FROM structured_data sd
    WHERE NOT EXISTS (
      SELECT 1 FROM documents d WHERE d.id = sd.document_id
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO structured_count FROM deleted_structured;
  
  RETURN QUERY SELECT chunks_count, structured_count;
END;
$$; 