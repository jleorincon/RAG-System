export interface Document {
    id: string;
    title: string;
    content: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface DocumentChunk {
    id: string;
    documentId: string;
    content: string;
    embedding: number[];
    metadata: Record<string, any>;
    chunkIndex: number;
}
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: DocumentChunk[];
    timestamp: Date;
}
export interface UploadDocumentRequest {
    file: Buffer | Uint8Array;
    filename: string;
    title?: string;
    metadata?: Record<string, any>;
}
export interface ChatRequest {
    message: string;
    sessionId?: string;
}
export interface ChatResponse {
    message: string;
    sources: DocumentChunk[];
    sessionId: string;
}
//# sourceMappingURL=types.d.ts.map