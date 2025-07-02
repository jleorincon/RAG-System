import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    // Get interactions from database
    const { supabase } = await import('@/lib/api/supabase');
    if (!supabase) {
      throw new Error('Database not available');
    }

    let query = supabase
      .from('user_interactions')
      .select('*')
      .order('created_at', { ascending: false });

    // Add search filter if provided
    if (search) {
      query = query.or(`query.ilike.%${search}%,response.ilike.%${search}%`);
    }

    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: interactions, error, count } = await query;

    if (error) {
      console.error('Error fetching interactions:', error);
      // Return empty array if table doesn't exist or other error
      return NextResponse.json({
        interactions: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      });
    }

    return NextResponse.json({
      interactions: interactions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in admin interactions API:', error);
    return NextResponse.json({
      interactions: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    });
  }
}

 