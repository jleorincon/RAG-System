import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await import('@/lib/api/supabase');
    if (!supabase) {
      throw new Error('Database not available');
    }

    let deletedChunks = 0;
    let deletedStructuredData = 0;

    try {
      // Find and delete orphaned document chunks (chunks without parent documents)
      const { data: orphanedChunks } = await supabase
        .from('document_chunks')
        .select('id, document_id')
        .not('document_id', 'in', 
          supabase.from('documents').select('id')
        );

      if (orphanedChunks && orphanedChunks.length > 0) {
        const chunkIds = orphanedChunks.map(chunk => chunk.id);
        const { error: deleteChunksError } = await supabase
          .from('document_chunks')
          .delete()
          .in('id', chunkIds);

        if (!deleteChunksError) {
          deletedChunks = orphanedChunks.length;
        }
      }
    } catch (error) {
      console.error('Error cleaning up chunks:', error);
    }

    try {
      // Find and delete orphaned structured data (data without parent documents)
      const { data: orphanedStructuredData } = await supabase
        .from('structured_data')
        .select('id, document_id')
        .not('document_id', 'in', 
          supabase.from('documents').select('id')
        );

      if (orphanedStructuredData && orphanedStructuredData.length > 0) {
        const structuredDataIds = orphanedStructuredData.map(data => data.id);
        const { error: deleteStructuredError } = await supabase
          .from('structured_data')
          .delete()
          .in('id', structuredDataIds);

        if (!deleteStructuredError) {
          deletedStructuredData = orphanedStructuredData.length;
        }
      }
    } catch (error) {
      console.error('Error cleaning up structured data:', error);
    }

    return NextResponse.json({
      success: true,
      deletedChunks,
      deletedStructuredData,
      message: `Cleanup completed: ${deletedChunks} chunks and ${deletedStructuredData} structured data entries removed.`
    });
  } catch (error) {
    console.error('Error in cleanup API:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup data' },
      { status: 500 }
    );
  }
} 