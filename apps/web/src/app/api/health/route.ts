import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Basic health check
    const health: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };

    // Test database connection
    try {
      const { supabase } = await import('@/lib/api/supabase');
      if (supabase) {
        const { error } = await supabase.from('documents').select('id').limit(1);
        health.database = error ? 'error' : 'connected';
      } else {
        health.database = 'not_configured';
      }
    } catch (error) {
      health.database = 'error';
    }

    return NextResponse.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 