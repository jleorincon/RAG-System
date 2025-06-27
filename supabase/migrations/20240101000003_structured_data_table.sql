-- Create structured_data table to store table data extracted from spreadsheets
CREATE TABLE IF NOT EXISTS structured_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    sheet_name TEXT,
    table_name TEXT,
    data JSONB NOT NULL,
    embedding vector(1536), -- OpenAI embeddings are 1536 dimensions
    row_count INTEGER,
    column_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_structured_data_document_id ON structured_data(document_id);
CREATE INDEX IF NOT EXISTS idx_structured_data_embedding ON structured_data USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_structured_data_sheet_name ON structured_data(sheet_name);

-- Enable Row Level Security (RLS)
ALTER TABLE structured_data ENABLE ROW LEVEL SECURITY;

-- Create policies for structured_data table
CREATE POLICY "Allow public read access to structured_data" ON structured_data
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to structured_data" ON structured_data
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to structured_data" ON structured_data
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to structured_data" ON structured_data
    FOR DELETE USING (true);

-- Create a function to search for similar structured data using vector similarity
CREATE OR REPLACE FUNCTION match_structured_data(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  sheet_name text,
  table_name text,
  data jsonb,
  embedding vector(1536),
  row_count int,
  column_count int,
  created_at timestamptz,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sd.id,
    sd.document_id,
    sd.sheet_name,
    sd.table_name,
    sd.data,
    sd.embedding,
    sd.row_count,
    sd.column_count,
    sd.created_at,
    sd.metadata,
    1 - (sd.embedding <=> query_embedding) AS similarity
  FROM structured_data sd
  WHERE 1 - (sd.embedding <=> query_embedding) > match_threshold
  ORDER BY sd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$; 