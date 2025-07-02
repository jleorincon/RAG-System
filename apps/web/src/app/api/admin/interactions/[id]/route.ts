import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Interaction ID is required' },
        { status: 400 }
      );
    }

    const { supabase } = await import('@/lib/api/supabase');
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { error } = await supabase
      .from('user_interactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting interaction:', error);
      return NextResponse.json(
        { error: 'Failed to delete interaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting interaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete interaction' },
      { status: 500 }
    );
  }
} 