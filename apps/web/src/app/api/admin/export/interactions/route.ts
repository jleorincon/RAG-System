import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get all interactions from database
    const { supabase } = await import('@/lib/api/supabase');
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data: interactions, error } = await supabase
      .from('user_interactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching interactions for export:', error);
      // Return empty CSV if table doesn't exist
      const csvContent = 'ID,Query,Response,Session ID,Created At\n';
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="interactions-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Convert to CSV
    const csvHeaders = ['ID', 'Query', 'Response', 'Session ID', 'Created At'];
    const csvRows = interactions?.map(interaction => [
      interaction.id,
      interaction.query || '',
      interaction.response || '',
      interaction.session_id || '',
      interaction.created_at || ''
    ]) || [];

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="interactions-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting interactions:', error);
    return NextResponse.json(
      { error: 'Failed to export interactions' },
      { status: 500 }
    );
  }
} 