"use strict";
// API package entry point
// RAG System Core Backend Implementation
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeholder = exports.server = exports.ChatService = exports.DocumentService = exports.supabaseAdmin = exports.supabase = exports.dbOperations = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./utils"), exports);
var supabase_1 = require("./supabase");
Object.defineProperty(exports, "dbOperations", { enumerable: true, get: function () { return supabase_1.dbOperations; } });
Object.defineProperty(exports, "supabase", { enumerable: true, get: function () { return supabase_1.supabase; } });
Object.defineProperty(exports, "supabaseAdmin", { enumerable: true, get: function () { return supabase_1.supabaseAdmin; } });
// Core services
var documentService_1 = require("./services/documentService");
Object.defineProperty(exports, "DocumentService", { enumerable: true, get: function () { return documentService_1.DocumentService; } });
var chatService_1 = require("./services/chatService");
Object.defineProperty(exports, "ChatService", { enumerable: true, get: function () { return chatService_1.ChatService; } });
// Server
var server_1 = require("./server");
Object.defineProperty(exports, "server", { enumerable: true, get: function () { return __importDefault(server_1).default; } });
// Placeholder exports for future implementation
exports.placeholder = 'API package initialized';
//# sourceMappingURL=index.js.map