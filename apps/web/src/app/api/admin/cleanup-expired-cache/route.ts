import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await import('@/lib/api/supabase');
    if (!supabase) {
      throw new Error('Database not available');
    }

    // Delete expired cache entries
    const { count, error } = await supabase
      .from('web_content_cache')
      .delete({ count: 'exact' })
      .lt('cache_expires_at', new Date().toISOString());

    if (error) {
      console.error('Error cleaning up expired cache:', error);
      // Don't throw error if table doesn't exist
      if (!error.message.includes('does not exist')) {
        throw error;
      }
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: 'No expired cache entries found'
      });
    }

    return NextResponse.json({
      success: true,
      deletedCount: count || 0,
      message: `Cleaned up ${count || 0} expired cache entries`
    });
  } catch (error) {
    console.error('Error in cleanup expired cache API:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup expired cache' },
      { status: 500 }
    );
  }
} 