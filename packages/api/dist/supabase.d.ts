export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", any> | null;
export declare const supabaseAdmin: import("@supabase/supabase-js").SupabaseClient<any, "public", any> | null;
export interface Document {
    id: string;
    title: string;
    content: string;
    file_type: string;
    file_size: number;
    upload_date: string;
    updated_at: string;
    metadata: Record<string, any>;
}
export interface DocumentChunk {
    id: string;
    document_id: string;
    chunk_index: number;
    content: string;
    embedding: number[] | null;
    token_count: number;
    created_at: string;
    metadata: Record<string, any>;
}
export interface StructuredData {
    id: string;
    document_id: string;
    sheet_name: string | null;
    table_name: string | null;
    data: Record<string, any>;
    embedding: number[] | null;
    row_count: number | null;
    column_count: number | null;
    created_at: string;
    metadata: Record<string, any>;
}
export declare const dbOperations: {
    insertDocument(document: Omit<Document, "id" | "upload_date" | "updated_at">): Promise<any>;
    insertDocumentChunks(chunks: Omit<DocumentChunk, "id" | "created_at">[]): Promise<any[]>;
    getDocuments(): Promise<any[]>;
    getDocumentWithChunks(documentId: string): Promise<any>;
    searchSimilarChunks(embedding: number[], limit?: number, threshold?: number): Promise<any>;
    deleteDocument(documentId: string): Promise<void>;
    insertStructuredData(structuredData: Omit<StructuredData, "id" | "created_at">[]): Promise<any[]>;
    getStructuredDataByDocument(documentId: string): Promise<any[]>;
    searchSimilarStructuredData(embedding: number[], limit?: number, threshold?: number): Promise<any>;
};
//# sourceMappingURL=supabase.d.ts.map