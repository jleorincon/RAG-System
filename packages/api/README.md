# RAG System API

This package contains the core backend implementation for the RAG (Retrieval-Augmented Generation) system.

## Features

### Document Processing
- **File Upload**: Supports PDF, DOCX, and TXT files
- **Text Extraction**: Extracts text content from various file formats
- **Document Chunking**: Splits documents into manageable chunks with overlap
- **Embedding Generation**: Creates vector embeddings using OpenAI's embedding models
- **Vector Storage**: Stores embeddings in Supabase with pgvector

### Chat & Retrieval
- **Semantic Search**: Finds relevant document chunks using vector similarity
- **RAG Pipeline**: Combines retrieval with generation using LangChain
- **Streaming Support**: Provides real-time streaming responses
- **Context Formatting**: Properly formats retrieved context for the LLM

## API Endpoints

### Document Management
- `POST /api/documents/upload` - Upload and process documents
- `GET /api/documents` - List all documents
- `DELETE /api/documents/:id` - Delete a document

### Chat
- `POST /api/chat` - Generate chat responses with RAG
- `POST /api/chat/stream` - Streaming chat responses

### Search
- `POST /api/search` - Search documents by semantic similarity

### Health
- `GET /health` - Health check endpoint

## Environment Variables

Create a `.env` file with the following variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server Configuration
PORT=3001
NODE_ENV=development
```

## Usage

### Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev:server

# Build for production
pnpm build

# Start production server
pnpm start
```

### Example Usage

#### Upload a Document
```bash
curl -X POST \
  http://localhost:3001/api/documents/upload \
  -F "file=@document.pdf" \
  -F "title=My Document" \
  -F "metadata={\"category\":\"research\"}"
```

#### Chat with Documents
```bash
curl -X POST \
  http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the main topic of the uploaded documents?",
    "sessionId": "user-123"
  }'
```

#### Search Documents
```bash
curl -X POST \
  http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning algorithms",
    "limit": 5,
    "threshold": 0.7
  }'
```

## Architecture

### Services

#### DocumentService
- Handles file processing and document management
- Extracts text from various file formats
- Creates document chunks and generates embeddings
- Manages document storage in Supabase

#### ChatService
- Implements the RAG pipeline
- Retrieves relevant document chunks
- Generates contextual responses using OpenAI
- Supports both regular and streaming responses

### Database Schema

The system uses Supabase with the following tables:
- `documents` - Stores document metadata
- `document_chunks` - Stores text chunks with vector embeddings

### Vector Search

Uses pgvector extension for efficient similarity search:
- Cosine similarity for finding relevant chunks
- Configurable similarity threshold
- Optimized with IVFFLAT index

## Dependencies

### Core Dependencies
- `langchain` - LLM framework and text processing
- `@langchain/openai` - OpenAI integration
- `@supabase/supabase-js` - Supabase client
- `express` - Web server framework
- `multer` - File upload handling

### Document Processing
- `pdf-parse` - PDF text extraction
- `mammoth` - DOCX text extraction
- `tiktoken` - Token counting

## Error Handling

The API includes comprehensive error handling:
- File upload validation
- Document processing errors
- Database operation errors
- LLM generation errors
- Proper HTTP status codes and error messages

## Performance Considerations

- File size limits (10MB default)
- Chunk size optimization (1000 characters with 200 overlap)
- Vector index optimization for search performance
- Streaming responses for better user experience

## Security

- CORS configuration
- File type validation
- Input sanitization
- Environment variable protection
- Row Level Security (RLS) in Supabase 