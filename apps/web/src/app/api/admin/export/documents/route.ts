import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get all documents from database
    const { supabase } = await import('@/lib/api/supabase');
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .order('upload_date', { ascending: false });

    if (error) {
      throw error;
    }

    // Convert to CSV
    const csvHeaders = ['ID', 'Title', 'File Type', 'File Size', 'Upload Date', 'Updated At'];
    const csvRows = documents?.map(doc => [
      doc.id,
      doc.title || '',
      doc.file_type || '',
      doc.file_size || 0,
      doc.upload_date || '',
      doc.updated_at || ''
    ]) || [];

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="documents-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting documents:', error);
    return NextResponse.json(
      { error: 'Failed to export documents' },
      { status: 500 }
    );
  }
} 