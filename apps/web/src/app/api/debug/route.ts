import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG] Debug endpoint called');
    
    // Check environment variables (without exposing sensitive data)
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_REGION: process.env.VERCEL_REGION,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      timestamp: new Date().toISOString(),
    };

    console.log('[DEBUG] Environment check:', envCheck);

    // Test database connection
    let dbStatus = 'unknown';
    let dbError = null;
    
    try {
      console.log('[DEBUG] Testing database connection');
      const { supabase } = await import('@/lib/api/supabase');
      
      if (!supabase) {
        dbStatus = 'supabase_client_not_available';
      } else {
        // Test a simple query
        const { data, error } = await supabase
          .from('documents')
          .select('count')
          .limit(1);
          
        if (error) {
          dbStatus = 'connection_error';
          dbError = {
            code: error.code,
            message: error.message,
            details: error.details
          };
        } else {
          dbStatus = 'connected';
        }
      }
    } catch (error) {
      dbStatus = 'exception';
      dbError = error instanceof Error ? error.message : 'Unknown error';
    }

    console.log('[DEBUG] Database status:', dbStatus, dbError || '');

    return NextResponse.json({
      status: 'ok',
      environment: envCheck,
      database: {
        status: dbStatus,
        error: dbError
      },
      runtime: {
        platform: process.platform,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
      }
    });

  } catch (error) {
    console.error('[DEBUG] Error in debug endpoint:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 