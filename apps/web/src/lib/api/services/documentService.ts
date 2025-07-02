import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document as LangchainDocument } from 'langchain/document';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { dbOperations } from '../supabase';
import { randomUUID } from 'crypto';
import { EmbeddingService } from './embeddingService';

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

export class DocumentService {
  private embeddings: OpenAIEmbeddings | null;
  private textSplitter: RecursiveCharacterTextSplitter;
  private embeddingService: EmbeddingService;

  constructor() {
    // Only initialize embeddings if API key is available
    this.embeddings = process.env.OPENAI_API_KEY 
      ? new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: 'text-embedding-3-small',
        })
      : null;

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', ' ', ''],
    });

    this.embeddingService = new EmbeddingService();
  }

  private getEmbeddings(): OpenAIEmbeddings {
    if (!this.embeddings) {
      throw new Error('OpenAI API key not configured');
    }
    return this.embeddings;
  }

  async processDocument(
    file: Buffer,
    filename: string,
    title?: string,
    metadata: Record<string, any> = {}
  ): Promise<ProcessedDocument> {
    try {
      const fileType = this.getFileType(filename);
      const documentId = randomUUID();
      const documentTitle = title || filename;
      
      let content = '';
      let structuredDataEntries: StructuredDataEntry[] = [];

      if (fileType === 'xlsx') {
        // Handle XLSX files - extract both text and structured data
        const { text, structuredData } = await this.extractFromXLSX(file, filename);
        content = text;
        structuredDataEntries = structuredData;
      } else {
        // Handle other file types (PDF, DOCX, TXT)
        content = await this.extractTextFromFile(file, filename);
      }
      
      // Split content into chunks
      const chunks = await this.createChunks(content, documentId);
      
      // Generate embeddings for chunks
      const chunksWithEmbeddings = await this.generateEmbeddings(chunks);
      
      // Store document in database
      const document = await dbOperations.insertDocument({
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

      await dbOperations.insertDocumentChunks(dbChunks);

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

        await dbOperations.insertStructuredData(dbStructuredData);
      }

      return {
        id: document.id,
        title: document.title,
        content: document.content,
        chunks: chunksWithEmbeddings,
        structuredData: structuredDataEntries,
        metadata: document.metadata,
      };
    } catch (error) {
      console.error('Error processing document:', error);
      throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractTextFromFile(file: Buffer, filename: string): Promise<string> {
    const fileType = this.getFileType(filename);
    
    switch (fileType) {
      case 'pdf':
        // Dynamic import to avoid build-time issues
        const pdfParse = await import('pdf-parse');
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
        } catch (error) {
          throw new Error(`Unsupported file type: ${fileType}`);
        }
    }
  }

  private async extractFromXLSX(file: Buffer, filename: string): Promise<{ text: string; structuredData: StructuredDataEntry[] }> {
    const workbook = XLSX.read(file, { type: 'buffer' });
    let allText = '';
    const structuredData: StructuredDataEntry[] = [];

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
        const columnCount = Math.max(...jsonData.map((row: any) => Array.isArray(row) ? row.length : 0));
        
        // Convert to more structured format
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);
        const structuredRows = rows.map((row: any) => {
          const rowObj: Record<string, any> = {};
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

  private async generateSingleEmbedding(text: string): Promise<number[]> {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-ada-002',
    });

    const embedding = await embeddings.embedQuery(text);
    return embedding;
  }

  private getFileType(filename: string): string {
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

  private async createChunks(content: string, documentId: string): Promise<DocumentChunk[]> {
    const langchainDocs = await this.textSplitter.createDocuments([content]);
    
    return langchainDocs.map((doc, index) => ({
      id: randomUUID(),
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

  private async generateEmbeddings(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    const contents = chunks.map(chunk => chunk.content);
    const embeddings = await this.getEmbeddings().embedDocuments(contents);
    
    return chunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index],
    }));
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  async searchSimilarChunks(
    query: string,
    limit: number = 5,
    threshold: number = 0.8
  ): Promise<any[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.getEmbeddings().embedQuery(query);
      
      // Search for similar chunks in the database
      const similarChunks = await dbOperations.searchSimilarChunks(
        queryEmbedding,
        limit,
        threshold
      );
      
      return similarChunks;
    } catch (error) {
      console.error('Error searching similar chunks:', error);
      throw new Error(`Failed to search similar chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      await dbOperations.deleteDocument(documentId);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDocuments(): Promise<any[]> {
    try {
      return await dbOperations.getDocuments();
    } catch (error) {
      console.error('Error getting documents:', error);
      throw new Error(`Failed to get documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 