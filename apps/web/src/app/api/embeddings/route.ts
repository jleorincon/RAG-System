import { NextRequest, NextResponse } from 'next/server';
import { EmbeddingService } from '@/lib/api/services/embeddingService';

const embeddingService = new EmbeddingService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats': {
        const stats = await embeddingService.getEmbeddingStats();
        return NextResponse.json({ stats });
      }

      case 'search': {
        const query = searchParams.get('query');
        const limit = parseInt(searchParams.get('limit') || '10');
        const threshold = parseFloat(searchParams.get('threshold') || '0.7');

        if (!query) {
          return NextResponse.json(
            { error: 'Query parameter is required' },
            { status: 400 }
          );
        }

        const results = await embeddingService.unifiedSearch(query, {
          matchThreshold: threshold,
          matchCount: limit,
          includeChunks: true,
          includeStructured: true,
        });

        return NextResponse.json({ results });
      }

      case 'similar-documents': {
        const query = searchParams.get('query');
        const limit = parseInt(searchParams.get('limit') || '5');
        const threshold = parseFloat(searchParams.get('threshold') || '0.7');

        if (!query) {
          return NextResponse.json(
            { error: 'Query parameter is required' },
            { status: 400 }
          );
        }

        const documents = await embeddingService.findSimilarDocuments(query, {
          matchThreshold: threshold,
          matchCount: limit,
        });

        return NextResponse.json({ documents });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: stats, search, similar-documents' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in embeddings GET API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'cleanup': {
        const result = await embeddingService.cleanupOrphanedEmbeddings();
        return NextResponse.json({ result });
      }

      case 'reprocess': {
        const { documentId } = body;
        
        if (!documentId) {
          return NextResponse.json(
            { error: 'documentId is required for reprocess action' },
            { status: 400 }
          );
        }

        const result = await embeddingService.reprocessDocumentEmbeddings(documentId);
        return NextResponse.json({ result });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: cleanup, reprocess' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in embeddings POST API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text parameter is required and must be a string' },
        { status: 400 }
      );
    }

    const embedding = await embeddingService.generateEmbedding(text);
    
    return NextResponse.json({ 
      embedding,
      dimensions: embedding.length,
      model: 'text-embedding-3-small'
    });
  } catch (error) {
    console.error('Error in embeddings PUT API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 