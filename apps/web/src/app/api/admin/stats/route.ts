import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '@/lib/api/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get basic system statistics
    const stats = {
      totalDocuments: 0,
      totalInteractions: 0,
      totalChunks: 0,
      totalStructuredData: 0,
      totalStorageUsed: 0,
      avgResponseTime: 150, // placeholder
      lastUpdated: new Date().toISOString()
    };

    try {
      // Get document count
      const { supabase } = await import('@/lib/api/supabase');
      if (supabase) {
        const { count: docCount } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true });
        stats.totalDocuments = docCount || 0;

        // Get chunk count
        const { count: chunkCount } = await supabase
          .from('document_chunks')
          .select('*', { count: 'exact', head: true });
        stats.totalChunks = chunkCount || 0;

        // Get structured data count
        const { count: structuredCount } = await supabase
          .from('structured_data')
          .select('*', { count: 'exact', head: true });
        stats.totalStructuredData = structuredCount || 0;

        // Get interaction count
        const { count: interactionCount } = await supabase
          .from('user_interactions')
          .select('*', { count: 'exact', head: true });
        stats.totalInteractions = interactionCount || 0;

        // Calculate total storage used from documents
        const { data: documents } = await supabase
          .from('documents')
          .select('file_size');
        
        if (documents) {
          stats.totalStorageUsed = documents.reduce((total, doc) => {
            return total + (doc.file_size || 0);
          }, 0);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Return default stats if database query fails
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in admin stats API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system statistics' },
      { status: 500 }
    );
  }
} 