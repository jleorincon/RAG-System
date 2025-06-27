"use strict";
// Utility functions for the RAG system
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.sanitizeFilename = sanitizeFilename;
function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
function sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}
// More utilities will be added in later phases 
//# sourceMappingURL=utils.js.map