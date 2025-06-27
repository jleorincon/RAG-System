-- Enable the vector extension for storing embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable the uuid extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create documents table to store uploaded files and their metadata
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create document_chunks table to store text chunks with embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536), -- OpenAI embeddings are 1536 dimensions
    token_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Create policies for documents table
CREATE POLICY "Allow public read access to documents" ON documents
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to documents" ON documents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to documents" ON documents
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to documents" ON documents
    FOR DELETE USING (true);

-- Create policies for document_chunks table
CREATE POLICY "Allow public read access to document_chunks" ON document_chunks
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to document_chunks" ON document_chunks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to document_chunks" ON document_chunks
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to document_chunks" ON document_chunks
    FOR DELETE USING (true); 