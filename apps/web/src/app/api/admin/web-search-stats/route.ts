import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get web search statistics
    const stats = {
      totalSearches: 0,
      totalCachedPages: 0,
      cacheHitRate: 0,
      avgResponseTime: 0,
      lastCacheUpdate: new Date().toISOString(),
      topDomains: [] as { domain: string; count: number }[],
      recentSearches: [] as any[]
    };

    try {
      const { supabase } = await import('@/lib/api/supabase');
      if (supabase) {
        // Get cached content count
        const { count: cachedCount } = await supabase
          .from('web_content_cache')
          .select('*', { count: 'exact', head: true });
        stats.totalCachedPages = cachedCount || 0;

        // Get recent cached content for analysis
        const { data: recentCache } = await supabase
          .from('web_content_cache')
          .select('url, created_at, hit_count')
          .order('created_at', { ascending: false })
          .limit(10);

        if (recentCache) {
          // Calculate some basic stats
          stats.totalSearches = recentCache.reduce((sum, item) => sum + (item.hit_count || 0), 0);
          
          // Extract domains for top domains
          const domains = recentCache.map(item => {
            try {
              return new URL(item.url).hostname;
            } catch {
              return 'unknown';
            }
          });
          
          const domainCounts = domains.reduce((acc: Record<string, number>, domain) => {
            acc[domain] = (acc[domain] || 0) + 1;
            return acc;
          }, {});
          
          stats.topDomains = Object.entries(domainCounts)
            .map(([domain, count]) => ({ domain, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        }
      }
    } catch (error) {
      console.error('Error fetching web search stats:', error);
      // Return default stats if database query fails
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in web search stats API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch web search statistics' },
      { status: 500 }
    );
  }
} 