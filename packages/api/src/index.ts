// API package entry point
// RAG System Core Backend Implementation

export * from './types';
export * from './utils';
export { dbOperations, supabase, supabaseAdmin } from './supabase';

// Core services
export { DocumentService } from './services/documentService';
export { ChatService } from './services/chatService';

// Server
export { default as server } from './server';

// Service interfaces
export type {
  ProcessedDocument,
  DocumentChunk as ServiceDocumentChunk,
} from './services/documentService';

export type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  RetrievedChunk,
} from './services/chatService';

// Placeholder exports for future implementation
export const placeholder = 'API package initialized'; 