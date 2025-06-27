"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const openai_1 = require("openai");
const documentService_1 = require("./documentService");
const crypto_1 = require("crypto");
class ChatService {
    constructor() {
        // Only initialize OpenAI if API key is available
        this.openai = process.env.OPENAI_API_KEY
            ? new openai_1.OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            })
            : null;
        this.documentService = new documentService_1.DocumentService();
    }
    getOpenAI() {
        if (!this.openai) {
            throw new Error('OpenAI API key not configured');
        }
        return this.openai;
    }
    async chat(request) {
        try {
            const sessionId = request.sessionId || (0, crypto_1.randomUUID)();
            // Retrieve relevant document chunks
            const retrievedChunks = await this.retrieveRelevantChunks(request.message, 5, // Number of chunks to retrieve
            0.7 // Similarity threshold
            );
            // Format context from retrieved chunks
            const context = this.formatContext(retrievedChunks);
            // Create the system prompt
            const systemPrompt = `You are a helpful AI assistant that answers questions based on the provided context. 
Use the following pieces of context to answer the user's question. If you don't know the answer based on the context, say that you don't have enough information to provide a complete answer.

Context:
${context}

Please provide a comprehensive answer based on the context above. If you reference specific information, mention which document or source it came from.`;
            // Generate response using OpenAI
            const completion = await this.getOpenAI().chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: request.message }
                ],
                max_tokens: request.maxTokens || 1000,
                temperature: request.temperature || 0.7,
            });
            const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
            return {
                id: (0, crypto_1.randomUUID)(),
                message: response,
                sources: retrievedChunks,
                sessionId,
                timestamp: new Date(),
            };
        }
        catch (error) {
            console.error('Error in chat service:', error);
            throw new Error(`Failed to generate chat response: ${error.message}`);
        }
    }
    async retrieveRelevantChunks(query, limit = 5, threshold = 0.7) {
        try {
            const similarChunks = await this.documentService.searchSimilarChunks(query, limit, threshold);
            return similarChunks.map(chunk => ({
                id: chunk.id,
                content: chunk.content,
                similarity: chunk.similarity,
                documentId: chunk.document_id,
                documentTitle: chunk.document_title,
                chunkIndex: chunk.chunk_index,
            }));
        }
        catch (error) {
            console.error('Error retrieving relevant chunks:', error);
            return [];
        }
    }
    formatContext(chunks) {
        if (chunks.length === 0) {
            return 'No relevant context found.';
        }
        return chunks
            .map((chunk, index) => {
            const source = chunk.documentTitle || `Document ${chunk.documentId}`;
            return `[Source ${index + 1}: ${source}]\n${chunk.content}\n`;
        })
            .join('\n---\n');
    }
    async streamChat(request) {
        try {
            const retrievedChunks = await this.retrieveRelevantChunks(request.message, 5, 0.7);
            const context = this.formatContext(retrievedChunks);
            const systemPrompt = `You are a helpful AI assistant that answers questions based on the provided context. 
Use the following pieces of context to answer the user's question. If you don't know the answer based on the context, say that you don't have enough information to provide a complete answer.

Context:
${context}

Please provide a comprehensive answer based on the context above. If you reference specific information, mention which document or source it came from.`;
            const stream = await this.getOpenAI().chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: request.message }
                ],
                max_tokens: request.maxTokens || 1000,
                temperature: request.temperature || 0.7,
                stream: true,
            });
            return this.streamGenerator(stream);
        }
        catch (error) {
            console.error('Error in streaming chat:', error);
            throw new Error(`Failed to generate streaming response: ${error.message}`);
        }
    }
    async *streamGenerator(stream) {
        try {
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                    yield content;
                }
            }
        }
        catch (error) {
            console.error('Error in stream generator:', error);
            throw error;
        }
    }
    async getChatHistory(sessionId) {
        // This would typically be stored in a database
        // For now, return empty array as we're focusing on the core RAG functionality
        return [];
    }
    async clearChatHistory(sessionId) {
        // This would typically clear the chat history from database
        // For now, this is a placeholder
        console.log(`Clearing chat history for session: ${sessionId}`);
    }
}
exports.ChatService = ChatService;
//# sourceMappingURL=chatService.js.map