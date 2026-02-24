import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { requestId, reason } = await req.json();

    if (!requestId || !reason) {
      return NextResponse.json({ error: 'Request ID and reason required' }, { status: 400 });
    }

    // Update request status
    const { error } = await supabaseAdmin
      .from('gdpr_requests')
      .update({
        status: 'rejected',
        completed_at: new Date().toISOString(),
        rejection_reason: reason,
        processed_by: 'admin',
      })
      .eq('id', requestId);

    if (error) {
      console.error('Reject request error:', error);
      return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reject request error:', error);
    return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 });
  }
}
