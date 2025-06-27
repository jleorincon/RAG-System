# Database Setup Guide

This directory contains the Supabase configuration and database migrations for the RAG system.

## Prerequisites

1. **Supabase CLI**: Install the Supabase CLI
   ```bash
   npm install -g supabase
   ```

2. **Docker**: Required for running Supabase locally

## Local Development Setup

### 1. Initialize Local Supabase

```bash
# From the project root
supabase start
```

This will start all Supabase services locally:
- Database: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- API: `http://127.0.0.1:54321`
- Studio: `http://127.0.0.1:54323`
- Inbucket (emails): `http://127.0.0.1:54324`

### 2. Apply Database Migrations

The migrations will be automatically applied when you start Supabase locally. If you need to apply them manually:

```bash
supabase db reset
```

### 3. Environment Variables

Copy the example environment file and update it with your values:

```bash
cp env.example .env.local
```

For local development, use these values in your `.env.local`:

```env
# Local Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

## Production Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be ready

### 2. Link to Remote Project

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Deploy Migrations

```bash
supabase db push
```

### 4. Update Environment Variables

Update your production environment variables with the values from your Supabase project dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your project's anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your project's service role key (keep this secret!)

## Database Schema

### Tables

#### `documents`
Stores uploaded documents and their metadata.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Document title |
| content | TEXT | Full document content |
| file_type | TEXT | File type (pdf, docx, txt, etc.) |
| file_size | INTEGER | File size in bytes |
| upload_date | TIMESTAMPTZ | When the document was uploaded |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| metadata | JSONB | Additional metadata |

#### `document_chunks`
Stores text chunks from documents with their vector embeddings.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| document_id | UUID | Foreign key to documents table |
| chunk_index | INTEGER | Order of chunk within document |
| content | TEXT | Chunk text content |
| embedding | vector(1536) | OpenAI embedding vector |
| token_count | INTEGER | Number of tokens in chunk |
| created_at | TIMESTAMPTZ | Creation timestamp |
| metadata | JSONB | Additional metadata |

### Functions

#### `match_document_chunks`
Performs vector similarity search to find relevant document chunks.

Parameters:
- `query_embedding`: The embedding vector to search for
- `match_threshold`: Minimum similarity threshold (default: 0.8)
- `match_count`: Maximum number of results (default: 5)

#### `get_document_chunks_with_document_info`
Retrieves document chunks with their parent document information.

Parameters:
- `document_id_param`: Optional document ID filter
- `limit_param`: Maximum number of results (default: 50)

## Vector Extension

The database uses the `pgvector` extension to store and search vector embeddings. The embeddings are 1536-dimensional vectors from OpenAI's text-embedding models.

### Vector Search

Vector similarity search uses cosine distance with an IVFFlat index for performance:

```sql
SELECT * FROM document_chunks 
ORDER BY embedding <=> query_embedding 
LIMIT 5;
```

## Useful Commands

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# View database in browser
supabase studio

# Reset local database
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts

# View logs
supabase logs

# Check status
supabase status
``` 