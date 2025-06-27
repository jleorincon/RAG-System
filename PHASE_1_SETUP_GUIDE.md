# Phase 1: RAG System Setup Guide

## ✅ Completed Tasks

### 1. Supabase Project Setup
- ✅ Supabase project created and configured
- ✅ Project URL: `https://bunpgpsnrdztqpmqieuk.supabase.co`
- ✅ Vector extension (pgvector) already installed
- ✅ Supabase client (`@supabase/supabase-js`) already installed in the project

### 2. Schema Design
- ✅ Phase 1 migration file created: `supabase/migrations/20240101000006_phase1_basic_schema.sql`
- ✅ TypeScript types created: `apps/web/src/lib/api/phase1-types.ts`
- ✅ Database operations created: `apps/web/src/lib/api/phase1-db.ts`
- ✅ Test API route created: `apps/web/src/app/api/phase1-test/route.ts`

## 🚀 Deployment Steps

### Step 1: Environment Configuration

Create a `.env.local` file in `apps/web/` with your credentials:

```bash
# OpenAI Configuration (you'll need to add your API key)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://bunpgpsnrdztqpmqieuk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bnBncHNucmR6dHFwbXFpZXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjI3NTYsImV4cCI6MjA2NjUzODc1Nn0.AjeEBbbLmu4YPLeFkH8BzI9q7gR5wlCber4Io8huKzA
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Step 2: Deploy the Phase 1 Schema

You have two options to deploy the schema:

#### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI if you haven't:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref bunpgpsnrdztqpmqieuk
```

4. Deploy the migration:
```bash
supabase db push
```

#### Option B: Manual SQL Execution

If you can't use the CLI, execute the migration SQL directly in your Supabase dashboard:

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/bunpgpsnrdztqpmqieuk
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20240101000006_phase1_basic_schema.sql`
4. Execute the SQL

### Step 3: Test the Setup

1. Start your development server:
```bash
cd apps/web
pnpm dev
```

2. Test the schema (GET request):
```bash
curl http://localhost:3000/api/phase1-test
```

3. Test insert operations (POST request):
```bash
curl -X POST http://localhost:3000/api/phase1-test
```

## 📋 Phase 1 Schema Details

### Tables Created

#### `documents` table:
```sql
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text,
  source text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
```

#### `embeddings` table:
```sql
CREATE TABLE embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  embedding vector(1536), -- OpenAI embeddings dimension
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
```

### Features Included

- ✅ UUID primary keys
- ✅ Foreign key relationships with CASCADE delete
- ✅ Vector similarity search using HNSW index
- ✅ Row Level Security (RLS) enabled
- ✅ Public access policies (can be modified later)
- ✅ Performance indexes
- ✅ Vector similarity search function (`match_embeddings`)

### TypeScript Integration

- ✅ Type-safe database operations
- ✅ Proper TypeScript interfaces
- ✅ Error handling
- ✅ Promise-based API

## 🔧 Usage Examples

### Insert a Document
```typescript
import { phase1DB } from '@/lib/api/phase1-db';

const document = await phase1DB.insertDocument({
  content: "Your document content here",
  source: "file.txt",
  metadata: { author: "John Doe" }
});
```

### Insert an Embedding
```typescript
const embedding = await phase1DB.insertEmbedding({
  document_id: document.id,
  embedding: [0.1, 0.2, 0.3, ...] // 1536-dimensional vector
});
```

### Search Similar Embeddings
```typescript
const results = await phase1DB.searchSimilarEmbeddings(
  queryEmbedding, // 1536-dimensional vector
  0.8,           // similarity threshold
  5              // max results
);
```

## 🚨 Important Notes

1. **OpenAI API Key**: You'll need to add your OpenAI API key to generate embeddings
2. **Service Role Key**: Get your service role key from Supabase dashboard for admin operations
3. **Migration History**: The existing migration files in your project are more advanced - this Phase 1 setup is the basic foundation
4. **Vector Dimensions**: The schema assumes OpenAI embeddings (1536 dimensions) - adjust if using different models

## ✅ Verification Checklist

- [ ] Environment variables configured
- [ ] Migration deployed successfully
- [ ] Test API endpoints return success
- [ ] Can insert documents and embeddings
- [ ] Vector similarity search works
- [ ] No console errors in browser/server

## 🔄 Next Steps

After Phase 1 is complete, you can:
1. Add document upload functionality
2. Implement text chunking
3. Add embedding generation
4. Build a chat interface
5. Add more advanced features from your existing migration files

## 🆘 Troubleshooting

### Common Issues:

1. **Permission Errors**: Make sure you have the correct service role key
2. **Vector Extension**: Ensure pgvector extension is enabled (should already be done)
3. **Environment Variables**: Double-check all environment variables are set correctly
4. **Migration Conflicts**: If you have existing data, you may need to backup and restore

### Getting Help:

- Check Supabase logs in the dashboard
- Use the test API endpoints to debug
- Check browser console for client-side errors
- Review server logs for backend issues 