import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS(request: NextRequest) {
  console.log('[OPTIONS] CORS preflight request received for interactions');
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

    console.log(`[DELETE-INTERACTION] ${startTime} - Starting delete operation for interaction ID: ${id}`);
    console.log(`[DELETE-INTERACTION] ${startTime} - Request URL: ${request.url}`);
    console.log(`[DELETE-INTERACTION] ${startTime} - Environment: ${process.env.VERCEL_ENV || 'local'}`);

    if (!id) {
      console.error(`[DELETE-INTERACTION] ${startTime} - No interaction ID provided`);
      return NextResponse.json(
        { error: 'Interaction ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error(`[DELETE-INTERACTION] ${startTime} - Invalid UUID format: ${id}`);
      return NextResponse.json(
        { error: 'Invalid interaction ID format' },
        { status: 400 }
      );
    }

    console.log(`[DELETE-INTERACTION] ${startTime} - UUID validation passed`);

    // Get database connection
    console.log(`[DELETE-INTERACTION] ${startTime} - Importing Supabase client`);
    const { supabase } = await import('@/lib/api/supabase');
    if (!supabase) {
      console.error(`[DELETE-INTERACTION] ${startTime} - Database not available`);
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    console.log(`[DELETE-INTERACTION] ${startTime} - Supabase client loaded successfully`);

    // First check if interaction exists
    console.log(`[DELETE-INTERACTION] ${startTime} - Checking if interaction exists: ${id}`);
    const { data: existingInteraction, error: checkError } = await supabase
      .from('user_interactions')
      .select('id, question')
      .eq('id', id)
      .single();

    console.log(`[DELETE-INTERACTION] ${startTime} - Interaction check completed in ${Date.now() - startTime}ms`);

    if (checkError) {
      console.error(`[DELETE-INTERACTION] ${startTime} - Error checking interaction existence:`, checkError);
      console.error(`[DELETE-INTERACTION] ${startTime} - Error code: ${checkError.code}`);
      console.error(`[DELETE-INTERACTION] ${startTime} - Error message: ${checkError.message}`);
      
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Interaction not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Database error while checking interaction' },
        { status: 500 }
      );
    }

    if (!existingInteraction) {
      console.error(`[DELETE-INTERACTION] ${startTime} - Interaction not found: ${id}`);
      return NextResponse.json(
        { error: 'Interaction not found' },
        { status: 404 }
      );
    }

    console.log(`[DELETE-INTERACTION] ${startTime} - Interaction found, proceeding with deletion`);

    // Delete the interaction
    console.log(`[DELETE-INTERACTION] ${startTime} - Deleting interaction: ${id}`);
    const deleteStart = Date.now();
    const { error } = await supabase
      .from('user_interactions')
      .delete()
      .eq('id', id);

    console.log(`[DELETE-INTERACTION] ${startTime} - Interaction deletion completed in ${Date.now() - deleteStart}ms`);

    if (error) {
      console.error(`[DELETE-INTERACTION] ${startTime} - Error deleting interaction:`, error);
      console.error(`[DELETE-INTERACTION] ${startTime} - Error code: ${error.code}`);
      console.error(`[DELETE-INTERACTION] ${startTime} - Error message: ${error.message}`);
      return NextResponse.json(
        { error: 'Failed to delete interaction' },
        { status: 500 }
      );
    }

    const totalTime = Date.now() - startTime;
    console.log(`[DELETE-INTERACTION] ${startTime} - Interaction deleted successfully: ${id} (Total time: ${totalTime}ms)`);

    return NextResponse.json(
      { 
        success: true,
        message: 'Interaction deleted successfully',
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
    console.error(`[DELETE-INTERACTION] ${startTime} - Unexpected error after ${totalTime}ms:`, error);
    console.error(`[DELETE-INTERACTION] ${startTime} - Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    
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