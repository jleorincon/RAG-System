# RAG System Setup Guide

This guide will help you set up the complete RAG system from scratch.

## 🚀 Quick Start

### 1. Prerequisites

Ensure you have the following installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **pnpm 8+** - Install with `npm install -g pnpm`
- **Git** - [Download here](https://git-scm.com/)

### 2. Account Setup

You'll need accounts for:

- **OpenAI** - [Get API key](https://platform.openai.com/api-keys)
- **Supabase** - [Create project](https://supabase.com/dashboard)

### 3. Clone and Install

```bash
git clone <your-repo-url>
cd RAG-System
pnpm install
```

### 4. Environment Configuration

Copy the environment template:

```bash
cp env.example .env.local
```

Fill in your credentials:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key

# Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. Database Setup

#### Option A: Supabase Cloud

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20240101000001_initial_setup.sql`
4. Run the migration
5. Copy and paste the contents of `supabase/migrations/20240101000002_vector_search_function.sql`
6. Run the second migration

#### Option B: Local Supabase (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Apply migrations
supabase db reset
```

### 6. Start Development

```bash
pnpm dev
```

Visit `http://localhost:3000` to see your RAG system!

## 🔧 Detailed Configuration

### OpenAI Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new secret key
5. Copy the key and add it to your `.env.local` file

**Important**: Keep your API key secure and never commit it to version control.

### Supabase Setup

1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Wait for the project to be ready
4. Go to Settings > API
5. Copy your project URL and anon key
6. Go to Settings > API > Service Role Key
7. Copy the service role key

### Database Schema

The system uses two main tables:

- **documents**: Stores document metadata
- **document_chunks**: Stores text chunks with embeddings

The migrations also create:
- Vector similarity search functions
- Proper indexes for performance
- Row Level Security policies

## 🧪 Testing the Setup

### 1. Upload Test

1. Go to the Upload tab
2. Upload a sample PDF or text file
3. Check the browser console for success messages
4. Verify the document appears in your Supabase database

### 2. Chat Test

1. Switch to the Chat tab
2. Ask a question about your uploaded document
3. Verify you get a response with source citations

### 3. Database Verification

In your Supabase dashboard:
1. Go to Table Editor
2. Check the `documents` table has your uploaded file
3. Check the `document_chunks` table has the text chunks
4. Verify embeddings are stored (should see vector data)

## 🚨 Troubleshooting

### Common Issues

#### "Missing environment variables"
- Ensure all required environment variables are set
- Check for typos in variable names
- Restart your development server after changes

#### "Failed to process document"
- Check your OpenAI API key is valid
- Ensure you have sufficient API credits
- Verify the file format is supported (PDF, DOCX, TXT, MD)

#### "Database connection failed"
- Verify your Supabase URL and keys are correct
- Check if your Supabase project is running
- Ensure the migrations have been applied

#### "Vector search not working"
- Verify the pgvector extension is enabled in Supabase
- Check if the vector search function was created
- Ensure embeddings are being stored in the database

### Debug Steps

1. **Check Logs**: Look at browser console and terminal output
2. **Verify Environment**: Ensure all environment variables are set
3. **Test API Keys**: Verify OpenAI and Supabase credentials work
4. **Check Database**: Ensure tables and functions exist
5. **Restart Services**: Try restarting the development server

### Getting Help

If you're still having issues:

1. Check the main README.md for additional information
2. Look at the example files in the repository
3. Verify your setup matches the requirements
4. Create an issue with detailed error messages

## 🎯 Next Steps

Once your setup is working:

1. **Customize**: Modify the UI and chat behavior
2. **Add Features**: Implement additional file types or chat features
3. **Deploy**: Deploy to Vercel or your preferred platform
4. **Scale**: Add authentication, rate limiting, and monitoring

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [LangChain Documentation](https://docs.langchain.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)

---

🎉 **Congratulations!** You now have a fully functional RAG system ready for development and customization. 