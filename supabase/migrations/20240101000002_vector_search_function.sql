-- Create a function to search for similar document chunks using vector similarity
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  embedding vector(1536),
  token_count int,
  created_at timestamptz,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.content,
    dc.embedding,
    dc.token_count,
    dc.created_at,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create a function to get document chunks with their parent document info
CREATE OR REPLACE FUNCTION get_document_chunks_with_document_info(
  document_id_param uuid DEFAULT NULL,
  limit_param int DEFAULT 50
)
RETURNS TABLE (
  chunk_id uuid,
  document_id uuid,
  document_title text,
  document_file_type text,
  chunk_index int,
  chunk_content text,
  token_count int,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id AS chunk_id,
    dc.document_id,
    d.title AS document_title,
    d.file_type AS document_file_type,
    dc.chunk_index,
    dc.content AS chunk_content,
    dc.token_count,
    dc.created_at
  FROM document_chunks dc
  JOIN documents d ON dc.document_id = d.id
  WHERE (document_id_param IS NULL OR dc.document_id = document_id_param)
  ORDER BY dc.created_at DESC
  LIMIT limit_param;
END;
$$; 