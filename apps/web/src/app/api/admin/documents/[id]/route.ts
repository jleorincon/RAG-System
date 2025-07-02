import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS(request: NextRequest) {
  console.log('[OPTIONS] CORS preflight request received');
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    const { id } = params;

    console.log(`[DELETE] ${startTime} - Starting delete operation for document ID: ${id}`);
    console.log(`[DELETE] ${startTime} - Request URL: ${request.url}`);
    console.log(`[DELETE] ${startTime} - Request method: ${request.method}`);
    console.log(`[DELETE] ${startTime} - Environment: ${process.env.VERCEL_ENV || 'local'}`);

    if (!id) {
      console.error(`[DELETE] ${startTime} - No document ID provided`);
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error(`[DELETE] ${startTime} - Invalid UUID format: ${id}`);
      return NextResponse.json(
        { error: 'Invalid document ID format' },
        { status: 400 }
      );
    }

    console.log(`[DELETE] ${startTime} - UUID validation passed`);

    // Get database connection
    console.log(`[DELETE] ${startTime} - Importing Supabase client`);
    const { supabase } = await import('@/lib/api/supabase');
    if (!supabase) {
      console.error(`[DELETE] ${startTime} - Database not available`);
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    console.log(`[DELETE] ${startTime} - Supabase client loaded successfully`);
    console.log(`[DELETE] ${startTime} - Checking if document exists: ${id}`);
    
    // First check if document exists
    const { data: existingDoc, error: checkError } = await supabase
      .from('documents')
      .select('id, title')
      .eq('id', id)
      .single();

    console.log(`[DELETE] ${startTime} - Document check completed in ${Date.now() - startTime}ms`);

    if (checkError) {
      console.error(`[DELETE] ${startTime} - Error checking document existence:`, checkError);
      console.error(`[DELETE] ${startTime} - Error code: ${checkError.code}`);
      console.error(`[DELETE] ${startTime} - Error message: ${checkError.message}`);
      
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Database error while checking document' },
        { status: 500 }
      );
    }

    if (!existingDoc) {
      console.error(`[DELETE] ${startTime} - Document not found: ${id}`);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    console.log(`[DELETE] ${startTime} - Document found: ${existingDoc.title}, proceeding with deletion`);

    // Start a transaction to delete document and related data
    console.log(`[DELETE] ${startTime} - Deleting document chunks for: ${id}`);
    
    // Delete document chunks first (foreign key constraint)
    const chunkDeleteStart = Date.now();
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', id);

    console.log(`[DELETE] ${startTime} - Chunk deletion completed in ${Date.now() - chunkDeleteStart}ms`);

    if (chunksError) {
      console.error(`[DELETE] ${startTime} - Error deleting document chunks:`, chunksError);
      console.error(`[DELETE] ${startTime} - Chunks error code: ${chunksError.code}`);
      console.error(`[DELETE] ${startTime} - Chunks error message: ${chunksError.message}`);
      return NextResponse.json(
        { error: 'Failed to delete document chunks' },
        { status: 500 }
      );
    }

    console.log(`[DELETE] ${startTime} - Document chunks deleted successfully for: ${id}`);

    // Delete the document
    console.log(`[DELETE] ${startTime} - Deleting document: ${id}`);
    const docDeleteStart = Date.now();
    const { error: docError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    console.log(`[DELETE] ${startTime} - Document deletion completed in ${Date.now() - docDeleteStart}ms`);

    if (docError) {
      console.error(`[DELETE] ${startTime} - Error deleting document:`, docError);
      console.error(`[DELETE] ${startTime} - Document error code: ${docError.code}`);
      console.error(`[DELETE] ${startTime} - Document error message: ${docError.message}`);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    const totalTime = Date.now() - startTime;
    console.log(`[DELETE] ${startTime} - Document deleted successfully: ${id} (Total time: ${totalTime}ms)`);

    return NextResponse.json(
      { 
        message: 'Document deleted successfully',
        deletedId: id,
        executionTime: totalTime 
      },
      { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[DELETE] ${startTime} - Unexpected error after ${totalTime}ms:`, error);
    console.error(`[DELETE] ${startTime} - Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
} 