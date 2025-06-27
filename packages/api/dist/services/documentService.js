"use strict";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const openai_1 = require("@langchain/openai");
const text_splitter_1 = require("langchain/text_splitter");
const mammoth = __importStar(require("mammoth"));
const XLSX = __importStar(require("xlsx"));
const supabase_1 = require("../supabase");
const crypto_1 = require("crypto");
class DocumentService {
    constructor() {
        // Only initialize embeddings if API key is available
        this.embeddings = process.env.OPENAI_API_KEY
            ? new openai_1.OpenAIEmbeddings({
                openAIApiKey: process.env.OPENAI_API_KEY,
                modelName: 'text-embedding-3-small',
            })
            : null;
        this.textSplitter = new text_splitter_1.RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
            separators: ['\n\n', '\n', '. ', ' ', ''],
        });
    }
    getEmbeddings() {
        if (!this.embeddings) {
            throw new Error('OpenAI API key not configured');
        }
        return this.embeddings;
    }
    async processDocument(file, filename, title, metadata = {}) {
        try {
            const fileType = this.getFileType(filename);
            const documentId = (0, crypto_1.randomUUID)();
            const documentTitle = title || filename;
            let content = '';
            let structuredDataEntries = [];
            if (fileType === 'xlsx') {
                // Handle XLSX files - extract both text and structured data
                const { text, structuredData } = await this.extractFromXLSX(file, filename);
                content = text;
                structuredDataEntries = structuredData;
            }
            else {
                // Handle other file types (PDF, DOCX, TXT)
                content = await this.extractTextFromFile(file, filename);
            }
            // Split content into chunks
            const chunks = await this.createChunks(content, documentId);
            // Generate embeddings for chunks
            const chunksWithEmbeddings = await this.generateEmbeddings(chunks);
            // Store document in database
            const document = await supabase_1.dbOperations.insertDocument({
                title: documentTitle,
                content,
                file_type: fileType,
                file_size: file.length,
                metadata: {
                    ...metadata,
                    originalFilename: filename,
                    chunkCount: chunksWithEmbeddings.length,
                    structuredDataCount: structuredDataEntries.length,
                },
            });
            // Store chunks with embeddings
            const dbChunks = chunksWithEmbeddings.map((chunk, index) => ({
                document_id: document.id,
                chunk_index: index,
                content: chunk.content,
                embedding: chunk.embedding,
                token_count: chunk.tokenCount,
                metadata: chunk.metadata,
            }));
            await supabase_1.dbOperations.insertDocumentChunks(dbChunks);
            // Store structured data if any
            if (structuredDataEntries.length > 0) {
                const dbStructuredData = structuredDataEntries.map(entry => ({
                    document_id: document.id,
                    sheet_name: entry.sheetName,
                    table_name: entry.tableName,
                    data: entry.data,
                    embedding: entry.embedding,
                    row_count: entry.rowCount,
                    column_count: entry.columnCount,
                    metadata: entry.metadata,
                }));
                await supabase_1.dbOperations.insertStructuredData(dbStructuredData);
            }
            return {
                id: document.id,
                title: document.title,
                content: document.content,
                chunks: chunksWithEmbeddings,
                structuredData: structuredDataEntries,
                metadata: document.metadata,
            };
        }
        catch (error) {
            console.error('Error processing document:', error);
            throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async extractTextFromFile(file, filename) {
        const fileType = this.getFileType(filename);
        switch (fileType) {
            case 'pdf':
                // Dynamic import to avoid build-time issues
                const pdfParse = await Promise.resolve().then(() => __importStar(require('pdf-parse')));
                const pdfData = await pdfParse.default(file);
                return pdfData.text;
            case 'docx':
                const docxResult = await mammoth.extractRawText({ buffer: file });
                return docxResult.value;
            case 'txt':
                return file.toString('utf-8');
            default:
                // Try to parse as text
                try {
                    return file.toString('utf-8');
                }
                catch (error) {
                    throw new Error(`Unsupported file type: ${fileType}`);
                }
        }
    }
    async extractFromXLSX(file, filename) {
        const workbook = XLSX.read(file, { type: 'buffer' });
        let allText = '';
        const structuredData = [];
        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            // Convert to JSON for structured data
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (jsonData.length > 0) {
                // Extract text representation
                const sheetText = XLSX.utils.sheet_to_csv(worksheet);
                allText += `\n\n=== Sheet: ${sheetName} ===\n${sheetText}`;
                // Create structured data entry
                const rowCount = jsonData.length;
                const columnCount = Math.max(...jsonData.map((row) => Array.isArray(row) ? row.length : 0));
                // Convert to more structured format
                const headers = jsonData[0];
                const rows = jsonData.slice(1);
                const structuredRows = rows.map((row) => {
                    const rowObj = {};
                    headers.forEach((header, index) => {
                        rowObj[header || `Column_${index + 1}`] = row[index] || '';
                    });
                    return rowObj;
                });
                const tableData = {
                    headers,
                    rows: structuredRows,
                    summary: {
                        totalRows: rowCount,
                        totalColumns: columnCount,
                        sheetName
                    }
                };
                // Generate embedding for the structured data
                const dataText = JSON.stringify(tableData);
                const embedding = await this.generateSingleEmbedding(dataText);
                structuredData.push({
                    sheetName,
                    tableName: `${sheetName}_table`,
                    data: tableData,
                    rowCount,
                    columnCount,
                    embedding,
                    metadata: {
                        originalSheetName: sheetName,
                        extractedAt: new Date().toISOString(),
                        hasHeaders: headers.length > 0
                    }
                });
            }
        }
        return { text: allText.trim(), structuredData };
    }
    async generateSingleEmbedding(text) {
        const embeddings = new openai_1.OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: 'text-embedding-ada-002',
        });
        const embedding = await embeddings.embedQuery(text);
        return embedding;
    }
    getFileType(filename) {
        const extension = filename.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return 'pdf';
            case 'docx':
                return 'docx';
            case 'xlsx':
                return 'xlsx';
            case 'txt':
                return 'txt';
            case 'md':
                return 'markdown';
            default:
                return 'unknown';
        }
    }
    async createChunks(content, documentId) {
        const langchainDocs = await this.textSplitter.createDocuments([content]);
        return langchainDocs.map((doc, index) => ({
            id: (0, crypto_1.randomUUID)(),
            content: doc.pageContent,
            embedding: [], // Will be filled by generateEmbeddings
            chunkIndex: index,
            tokenCount: this.estimateTokenCount(doc.pageContent),
            metadata: {
                documentId,
                ...doc.metadata,
            },
        }));
    }
    async generateEmbeddings(chunks) {
        const contents = chunks.map(chunk => chunk.content);
        const embeddings = await this.getEmbeddings().embedDocuments(contents);
        return chunks.map((chunk, index) => ({
            ...chunk,
            embedding: embeddings[index],
        }));
    }
    estimateTokenCount(text) {
        // Rough estimation: 1 token ≈ 4 characters
        return Math.ceil(text.length / 4);
    }
    async searchSimilarChunks(query, limit = 5, threshold = 0.8) {
        try {
            // Generate embedding for the query
            const queryEmbedding = await this.getEmbeddings().embedQuery(query);
            // Search for similar chunks in the database
            const similarChunks = await supabase_1.dbOperations.searchSimilarChunks(queryEmbedding, limit, threshold);
            return similarChunks;
        }
        catch (error) {
            console.error('Error searching similar chunks:', error);
            throw new Error(`Failed to search similar chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteDocument(documentId) {
        try {
            await supabase_1.dbOperations.deleteDocument(documentId);
        }
        catch (error) {
            console.error('Error deleting document:', error);
            throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getDocuments() {
        try {
            return await supabase_1.dbOperations.getDocuments();
        }
        catch (error) {
            console.error('Error getting documents:', error);
            throw new Error(`Failed to get documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.DocumentService = DocumentService;
//# sourceMappingURL=documentService.js.map