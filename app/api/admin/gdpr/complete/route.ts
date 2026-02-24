import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { requestId, adminNotes } = await req.json();

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID required' }, { status: 400 });
    }

    // Update request status
    const { error } = await supabaseAdmin
      .from('gdpr_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
        processed_by: 'admin',
      })
      .eq('id', requestId);

    if (error) {
      console.error('Complete request error:', error);
      return NextResponse.json({ error: 'Failed to complete request' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Complete request error:', error);
    return NextResponse.json({ error: 'Failed to complete request' }, { status: 500 });
  }
}
