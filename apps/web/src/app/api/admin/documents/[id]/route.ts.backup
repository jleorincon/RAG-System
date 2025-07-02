import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS(request: NextRequest) {
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
  try {
    const { id } = params;

    console.log(`[DELETE] Attempting to delete document with ID: ${id}`);

    if (!id) {
      console.error('[DELETE] No document ID provided');
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error(`[DELETE] Invalid UUID format: ${id}`);
      return NextResponse.json(
        { error: 'Invalid document ID format' },
        { status: 400 }
      );
    }

    // Get database connection
    const { supabase } = await import('@/lib/api/supabase');
    if (!supabase) {
      console.error('[DELETE] Database not available');
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    console.log(`[DELETE] Checking if document exists: ${id}`);
    
    // First check if document exists
    const { data: existingDoc, error: checkError } = await supabase
      .from('documents')
      .select('id, title')
      .eq('id', id)
      .single();

    if (checkError) {
      console.error('[DELETE] Error checking document existence:', checkError);
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
      console.error(`[DELETE] Document not found: ${id}`);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    console.log(`[DELETE] Document found: ${existingDoc.title}, proceeding with deletion`);

    // Start a transaction to delete document and related data
    console.log(`[DELETE] Deleting document chunks for: ${id}`);
    
    // Delete document chunks first (foreign key constraint)
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', id);

    if (chunksError) {
      console.error('[DELETE] Error deleting document chunks:', chunksError);
      return NextResponse.json(
        { error: 'Failed to delete document chunks' },
        { status: 500 }
      );
    }

    console.log(`[DELETE] Document chunks deleted successfully for: ${id}`);

    // Delete the document
    console.log(`[DELETE] Deleting document: ${id}`);
    const { error: docError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (docError) {
      console.error('[DELETE] Error deleting document:', docError);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    console.log(`[DELETE] Document deleted successfully: ${id}`);

    return NextResponse.json(
      { 
        message: 'Document deleted successfully',
        deletedId: id 
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
    console.error('[DELETE] Unexpected error:', error);
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