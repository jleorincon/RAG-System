import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await import('@/lib/api/supabase');
    if (!supabase) {
      throw new Error('Database not available');
    }

    // Clear all cached web content
    const { error } = await supabase
      .from('web_content_cache')
      .delete()
      .neq('id', ''); // Delete all rows

    if (error) {
      console.error('Error clearing web cache:', error);
      // Don't throw error if table doesn't exist
      if (!error.message.includes('does not exist')) {
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Web search cache cleared successfully'
    });
  } catch (error) {
    console.error('Error in clear web cache API:', error);
    return NextResponse.json(
      { error: 'Failed to clear web search cache' },
      { status: 500 }
    );
  }
} 