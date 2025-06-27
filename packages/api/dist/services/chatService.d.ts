export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: RetrievedChunk[];
    timestamp: Date;
}
export interface RetrievedChunk {
    id: string;
    content: string;
    similarity: number;
    documentId: string;
    documentTitle?: string;
    chunkIndex: number;
}
export interface ChatRequest {
    message: string;
    sessionId?: string;
    maxTokens?: number;
    temperature?: number;
}
export interface ChatResponse {
    id: string;
    message: string;
    sources: RetrievedChunk[];
    sessionId: string;
    timestamp: Date;
}
export declare class ChatService {
    private openai;
    private documentService;
    constructor();
    private getOpenAI;
    chat(request: ChatRequest): Promise<ChatResponse>;
    private retrieveRelevantChunks;
    private formatContext;
    streamChat(request: ChatRequest): Promise<AsyncGenerator<string, void, unknown>>;
    private streamGenerator;
    getChatHistory(sessionId: string): Promise<ChatMessage[]>;
    clearChatHistory(sessionId: string): Promise<void>;
}
//# sourceMappingURL=chatService.d.ts.map