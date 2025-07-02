import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST-DEPLOYMENT] Test route called');
    
    // Test environment variables
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_REGION: process.env.VERCEL_REGION,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      timestamp: new Date().toISOString(),
    };

    // Test database connection
    let dbTest = 'not_tested';
    try {
      const { supabase } = await import('@/lib/api/supabase');
      if (supabase) {
        const { data, error } = await supabase
          .from('documents')
          .select('count')
          .limit(1);
        dbTest = error ? `error: ${error.message}` : 'connected';
      } else {
        dbTest = 'supabase_client_not_available';
      }
    } catch (error) {
      dbTest = `exception: ${error instanceof Error ? error.message : 'unknown'}`;
    }

    return NextResponse.json({
      status: 'deployment_test_success',
      message: 'API routes are deployed and working',
      environment: envCheck,
      database: dbTest,
      deployment_info: {
        route_path: '/api/admin/test-deployment',
        method: 'GET',
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
      }
    });

  } catch (error) {
    console.error('[TEST-DEPLOYMENT] Error:', error);
    return NextResponse.json(
      { 
        status: 'deployment_test_failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('[TEST-DEPLOYMENT] DELETE method test');
    
    return NextResponse.json({
      status: 'delete_method_works',
      message: 'DELETE method is properly configured',
      url: request.url,
      method: request.method,
    });

  } catch (error) {
    return NextResponse.json(
      { 
        status: 'delete_method_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 