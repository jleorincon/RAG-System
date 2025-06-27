"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbOperations = exports.supabaseAdmin = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
// Environment variables for Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Runtime validation function
function validateSupabaseConfig() {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
    }
}
// Client for public operations (using anon key)
exports.supabase = supabaseUrl && supabaseAnonKey
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey)
    : null;
// Admin client for service operations (using service role key)
exports.supabaseAdmin = supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey)
    ? (0, supabase_js_1.createClient)(supabaseUrl, (supabaseServiceRoleKey || supabaseAnonKey), {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;
// Helper functions for database operations
exports.dbOperations = {
    // Insert a new document
    async insertDocument(document) {
        validateSupabaseConfig();
        if (!exports.supabase)
            throw new Error('Supabase client not initialized');
        const { data, error } = await exports.supabase
            .from('documents')
            .insert(document)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    // Insert document chunks with embeddings
    async insertDocumentChunks(chunks) {
        validateSupabaseConfig();
        if (!exports.supabase)
            throw new Error('Supabase client not initialized');
        const { data, error } = await exports.supabase
            .from('document_chunks')
            .insert(chunks)
            .select();
        if (error)
            throw error;
        return data;
    },
    // Get all documents
    async getDocuments() {
        validateSupabaseConfig();
        if (!exports.supabase)
            throw new Error('Supabase client not initialized');
        const { data, error } = await exports.supabase
            .from('documents')
            .select('*')
            .order('upload_date', { ascending: false });
        if (error)
            throw error;
        return data;
    },
    // Get document by ID with its chunks
    async getDocumentWithChunks(documentId) {
        validateSupabaseConfig();
        if (!exports.supabase)
            throw new Error('Supabase client not initialized');
        const { data, error } = await exports.supabase
            .from('documents')
            .select(`
        *,
        document_chunks (*)
      `)
            .eq('id', documentId)
            .single();
        if (error)
            throw error;
        return data;
    },
    // Search for similar document chunks using vector similarity
    async searchSimilarChunks(embedding, limit = 5, threshold = 0.8) {
        validateSupabaseConfig();
        if (!exports.supabase)
            throw new Error('Supabase client not initialized');
        const { data, error } = await exports.supabase.rpc('match_document_chunks', {
            query_embedding: embedding,
            match_threshold: threshold,
            match_count: limit
        });
        if (error)
            throw error;
        return data;
    },
    // Delete a document and its chunks
    async deleteDocument(documentId) {
        validateSupabaseConfig();
        if (!exports.supabase)
            throw new Error('Supabase client not initialized');
        const { error } = await exports.supabase
            .from('documents')
            .delete()
            .eq('id', documentId);
        if (error)
            throw error;
    },
    // Insert structured data with embeddings
    async insertStructuredData(structuredData) {
        validateSupabaseConfig();
        if (!exports.supabase)
            throw new Error('Supabase client not initialized');
        const { data, error } = await exports.supabase
            .from('structured_data')
            .insert(structuredData)
            .select();
        if (error)
            throw error;
        return data;
    },
    // Get structured data by document ID
    async getStructuredDataByDocument(documentId) {
        validateSupabaseConfig();
        if (!exports.supabase)
            throw new Error('Supabase client not initialized');
        const { data, error } = await exports.supabase
            .from('structured_data')
            .select('*')
            .eq('document_id', documentId)
            .order('created_at', { ascending: true });
        if (error)
            throw error;
        return data;
    },
    // Search for similar structured data using vector similarity
    async searchSimilarStructuredData(embedding, limit = 5, threshold = 0.8) {
        validateSupabaseConfig();
        if (!exports.supabase)
            throw new Error('Supabase client not initialized');
        const { data, error } = await exports.supabase.rpc('match_structured_data', {
            query_embedding: embedding,
            match_threshold: threshold,
            match_count: limit
        });
        if (error)
            throw error;
        return data;
    }
};
//# sourceMappingURL=supabase.js.map