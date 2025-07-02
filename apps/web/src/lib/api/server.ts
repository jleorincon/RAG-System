import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { config } from 'dotenv';
import { DocumentService } from './services/documentService';
import { ChatService } from './services/chatService';

// Load environment variables
config();

const app: express.Application = express();
const port = process.env.PORT || 3001;

// Initialize services
const documentService = new DocumentService();
const chatService = new ChatService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload PDF, DOCX, XLSX, or TXT files.'));
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Document upload endpoint
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { title, metadata } = req.body;
    const parsedMetadata = metadata ? JSON.parse(metadata) : {};

    const result = await documentService.processDocument(
      req.file.buffer,
      req.file.originalname,
      title,
      parsedMetadata
    );

    res.json({
      success: true,
      document: {
        id: result.id,
        title: result.title,
        chunkCount: result.chunks.length,
        metadata: result.metadata,
      },
      message: 'Document uploaded and processed successfully',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to process document',
      details: (error as Error).message,
    });
  }
});

// Get all documents
app.get('/api/documents', async (req, res) => {
  try {
    const documents = await documentService.getDocuments();
    res.json({ documents });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      error: 'Failed to retrieve documents',
      details: (error as Error).message,
    });
  }
});

// Delete document
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await documentService.deleteDocument(id);
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      error: 'Failed to delete document',
      details: (error as Error).message,
    });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId, maxTokens, temperature } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await chatService.chat({
      message,
      sessionId,
      maxTokens,
      temperature,
    });

    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to generate chat response',
      details: (error as Error).message,
    });
  }
});

// Streaming chat endpoint
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { message, sessionId, maxTokens, temperature } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const stream = await chatService.streamChat({
      message,
      sessionId,
      maxTokens,
      temperature,
    });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Streaming chat error:', error);
    res.status(500).json({
      error: 'Failed to generate streaming response',
      details: (error as Error).message,
    });
  }
});

// Search documents endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query, limit = 5, threshold = 0.7 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await documentService.searchSimilarChunks(query, limit, threshold);
    res.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Failed to search documents',
      details: (error as Error).message,
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: error.message,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server only if this file is run directly (not imported)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`🚀 RAG API Server running on port ${port}`);
    console.log(`📚 Document upload: POST /api/documents/upload`);
    console.log(`💬 Chat endpoint: POST /api/chat`);
    console.log(`🔍 Search endpoint: POST /api/search`);
    console.log(`📋 Health check: GET /health`);
  });
}

export default app; 