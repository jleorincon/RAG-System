-- Migration: Web Content Cache
-- Description: Add tables for caching web search results and extracted content

-- Web content cache table
CREATE TABLE IF NOT EXISTS web_content_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL UNIQUE,
    title TEXT,
    content TEXT,
    snippet TEXT,
    source TEXT,
    published_date TIMESTAMP,
    search_query TEXT, -- The query that found this content
    last_fetched TIMESTAMP NOT NULL DEFAULT NOW(),
    cache_expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
    fetch_count INTEGER DEFAULT 1,
    content_hash TEXT, -- Hash of content for change detection
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Web search queries cache
CREATE TABLE IF NOT EXISTS web_search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text TEXT NOT NULL,
    query_hash TEXT NOT NULL, -- Hash of normalized query
    search_engine TEXT NOT NULL DEFAULT 'duckduckgo',
    max_results INTEGER DEFAULT 5,
    time_range TEXT,
    results_count INTEGER DEFAULT 0,
    last_searched TIMESTAMP NOT NULL DEFAULT NOW(),
    cache_expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
    search_count INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Junction table for query results
CREATE TABLE IF NOT EXISTS web_query_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID NOT NULL REFERENCES web_search_queries(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES web_content_cache(id) ON DELETE CASCADE,
    result_rank INTEGER NOT NULL, -- Position in search results
    similarity_score DECIMAL(5,4), -- Relevance score if available
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(query_id, content_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_web_content_cache_url ON web_content_cache(url);
CREATE INDEX IF NOT EXISTS idx_web_content_cache_query ON web_content_cache(search_query);
CREATE INDEX IF NOT EXISTS idx_web_content_cache_expires ON web_content_cache(cache_expires_at);
CREATE INDEX IF NOT EXISTS idx_web_content_cache_fetched ON web_content_cache(last_fetched DESC);

CREATE INDEX IF NOT EXISTS idx_web_search_queries_hash ON web_search_queries(query_hash);
CREATE INDEX IF NOT EXISTS idx_web_search_queries_expires ON web_search_queries(cache_expires_at);
CREATE INDEX IF NOT EXISTS idx_web_search_queries_searched ON web_search_queries(last_searched DESC);

CREATE INDEX IF NOT EXISTS idx_web_query_results_query ON web_query_results(query_id);
CREATE INDEX IF NOT EXISTS idx_web_query_results_content ON web_query_results(content_id);
CREATE INDEX IF NOT EXISTS idx_web_query_results_rank ON web_query_results(query_id, result_rank);

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_web_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired web content cache entries
    DELETE FROM web_content_cache 
    WHERE cache_expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete expired search queries (this will cascade to query_results)
    DELETE FROM web_search_queries 
    WHERE cache_expires_at < NOW();
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create cached web content
CREATE OR REPLACE FUNCTION get_cached_web_content(
    p_url TEXT,
    p_max_age_minutes INTEGER DEFAULT 60
)
RETURNS TABLE (
    id UUID,
    url TEXT,
    title TEXT,
    content TEXT,
    snippet TEXT,
    source TEXT,
    published_date TIMESTAMP,
    last_fetched TIMESTAMP,
    is_expired BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wcc.id,
        wcc.url,
        wcc.title,
        wcc.content,
        wcc.snippet,
        wcc.source,
        wcc.published_date,
        wcc.last_fetched,
        (wcc.cache_expires_at < NOW() OR wcc.last_fetched < NOW() - INTERVAL '1 minute' * p_max_age_minutes) as is_expired
    FROM web_content_cache wcc
    WHERE wcc.url = p_url;
END;
$$ LANGUAGE plpgsql;

-- Function to update web content cache hit count
CREATE OR REPLACE FUNCTION increment_web_cache_hit(p_url TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE web_content_cache 
    SET fetch_count = fetch_count + 1,
        updated_at = NOW()
    WHERE url = p_url;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_web_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_web_content_cache_updated_at
    BEFORE UPDATE ON web_content_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_web_cache_updated_at();

CREATE TRIGGER trigger_web_search_queries_updated_at
    BEFORE UPDATE ON web_search_queries
    FOR EACH ROW
    EXECUTE FUNCTION update_web_cache_updated_at();

-- Grant permissions
GRANT ALL ON web_content_cache TO authenticated;
GRANT ALL ON web_search_queries TO authenticated;
GRANT ALL ON web_query_results TO authenticated;

GRANT EXECUTE ON FUNCTION cleanup_expired_web_cache() TO authenticated;
GRANT EXECUTE ON FUNCTION get_cached_web_content(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_web_cache_hit(TEXT) TO authenticated; 