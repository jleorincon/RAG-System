import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/lib/api/services/documentService';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Initialize document service
    const documentService = new DocumentService();
    const results = [];
    
    for (const file of files) {
      try {
        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Process the document
        const result = await documentService.processDocument(
          buffer,
          file.name,
          file.name, // Use filename as title
          {
            originalSize: file.size,
            mimeType: file.type,
            uploadedAt: new Date().toISOString()
          }
        );

        results.push({
          success: true,
          filename: file.name,
          size: file.size,
          type: file.type,
          documentId: result.id,
          chunkCount: result.chunks.length,
          message: `File ${file.name} uploaded and processed successfully`
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        results.push({
          success: false,
          filename: file.name,
          error: error instanceof Error ? error.message : 'Upload failed'
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${files.length} file(s)`
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 