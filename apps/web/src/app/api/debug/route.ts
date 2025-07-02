import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel: {
        region: process.env.VERCEL_REGION,
        url: process.env.VERCEL_URL,
      },
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing',
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
      },
    };

    // Test database connection
    try {
      const { supabase } = await import('@/lib/api/supabase');
      if (supabase) {
        const { data, error } = await supabase.from('documents').select('count').limit(1);
        debugInfo.database = {
          connection: error ? 'error' : 'success',
          error: error?.message || null,
        };
      } else {
        debugInfo.database = { connection: 'client_not_available' };
      }
    } catch (dbError) {
      debugInfo.database = {
        connection: 'error',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error',
      };
    }

    return NextResponse.json(debugInfo);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Debug endpoint failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 