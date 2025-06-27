export interface ProcessedDocument {
    id: string;
    title: string;
    content: string;
    chunks: DocumentChunk[];
    structuredData?: StructuredDataEntry[];
    metadata: Record<string, any>;
}
export interface StructuredDataEntry {
    sheetName: string | null;
    tableName: string | null;
    data: Record<string, any>;
    rowCount: number;
    columnCount: number;
    embedding: number[];
    metadata: Record<string, any>;
}
export interface DocumentChunk {
    id: string;
    content: string;
    embedding: number[];
    chunkIndex: number;
    tokenCount: number;
    metadata: Record<string, any>;
}
export declare class DocumentService {
    private embeddings;
    private textSplitter;
    constructor();
    private getEmbeddings;
    processDocument(file: Buffer, filename: string, title?: string, metadata?: Record<string, any>): Promise<ProcessedDocument>;
    private extractTextFromFile;
    private extractFromXLSX;
    private generateSingleEmbedding;
    private getFileType;
    private createChunks;
    private generateEmbeddings;
    private estimateTokenCount;
    searchSimilarChunks(query: string, limit?: number, threshold?: number): Promise<any[]>;
    deleteDocument(documentId: string): Promise<void>;
    getDocuments(): Promise<any[]>;
}
//# sourceMappingURL=documentService.d.ts.map