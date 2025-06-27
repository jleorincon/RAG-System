# RAG System - Chat with Your Documents

A modern, full-stack Retrieval-Augmented Generation (RAG) system built with Next.js, LangChain, and Supabase. Upload documents and chat with them using AI-powered semantic search and natural language processing.

## 🚀 Features

- **Document Upload**: Support for PDF, DOCX, TXT, and Markdown files
- **AI-Powered Chat**: Natural language conversations with your documents
- **Vector Search**: Advanced semantic search using OpenAI embeddings
- **Source Citations**: Every answer includes references to source documents
- **Real-time Streaming**: Streaming responses for better user experience
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- **Monorepo Architecture**: Organized codebase with shared packages

## 🏗️ Architecture

```
RAG-System/
├── apps/
│   └── web/                 # Next.js frontend application
├── packages/
│   └── api/                 # Shared API package with services
├── supabase/               # Database schema and migrations
└── docs/                   # Documentation
```

### Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express, LangChain
- **Database**: Supabase (PostgreSQL with pgvector)
- **AI/ML**: OpenAI GPT-4, OpenAI Embeddings
- **Build System**: Turbo (monorepo), pnpm
- **Language**: TypeScript

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and pnpm 8+
- Supabase account
- OpenAI API key

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd RAG-System
pnpm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp env.example .env.local
```

Fill in your environment variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Database Setup

Run the Supabase migrations:

```bash
# If using Supabase CLI
supabase db reset

# Or apply migrations manually in your Supabase dashboard
```

The migrations will create:
- `documents` table for storing document metadata
- `document_chunks` table for storing text chunks with embeddings
- Vector search functions for similarity matching
- Proper indexes for optimal performance

### 4. Development

Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## 📚 Usage

### Uploading Documents

1. Navigate to the Upload tab
2. Drag and drop or select files (PDF, DOCX, TXT, MD)
3. Files are automatically processed and chunked
4. Embeddings are generated and stored in the database

### Chatting with Documents

1. Switch to the Chat tab after uploading documents
2. Ask questions in natural language
3. Receive AI-generated answers with source citations
4. Click on source citations to view the original content

## 🔧 Development Guide

### Project Structure

```
apps/web/src/
├── app/
│   ├── api/              # API routes
│   │   ├── chat/         # Chat endpoint
│   │   └── upload/       # File upload endpoint
│   └── page.tsx          # Main application page
├── components/
│   ├── chat/             # Chat-related components
│   ├── ui/               # Reusable UI components
│   └── upload/           # Upload components
└── lib/                  # Utilities

packages/api/src/
├── services/
│   ├── chatService.ts    # RAG chat logic
│   └── documentService.ts # Document processing
├── supabase.ts           # Database operations
└── types.ts              # Shared types
```

### Key Services

#### DocumentService
- Handles file parsing (PDF, DOCX, TXT)
- Text chunking with LangChain
- Embedding generation with OpenAI
- Database storage operations

#### ChatService
- Query processing and embedding
- Vector similarity search
- Context formatting
- AI response generation

### Adding New File Types

To support additional file formats:

1. Update `extractTextFromFile` in `DocumentService`
2. Add the new file type handling logic
3. Update the upload component to accept the new format

### Customizing Chat Behavior

Modify chat parameters in `ChatService`:
- `temperature`: Response creativity (0-1)
- `maxTokens`: Maximum response length
- `similarityThreshold`: Vector search sensitivity

## 🚀 Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

```env
OPENAI_API_KEY=your_production_openai_key
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

## 🧪 Testing

```bash
# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Build for production
pnpm build
```

## 📈 Performance Optimization

- **Vector Indexing**: Optimized pgvector indexes for fast similarity search
- **Chunking Strategy**: Balanced chunk size (1000 chars) with overlap (200 chars)
- **Streaming Responses**: Real-time response streaming for better UX
- **Caching**: Turbo caching for faster builds

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Environment variable validation
- Input sanitization for file uploads
- Rate limiting (recommended for production)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

---

Built with ❤️ using Next.js, LangChain, and Supabase. 