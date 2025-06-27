-- Create user_interactions table to log user interactions with the AI system
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_document_id ON user_interactions(document_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_session_id ON user_interactions(session_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_interactions table
CREATE POLICY "Allow public read access to user_interactions" ON user_interactions
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to user_interactions" ON user_interactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to user_interactions" ON user_interactions
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to user_interactions" ON user_interactions
    FOR DELETE USING (true); 