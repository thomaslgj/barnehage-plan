import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID required' }, { status: 400 });
    }

    // Get request details
    const { data: request, error: requestError } = await supabaseAdmin
      .from('gdpr_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const userId = request.user_id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found in request' }, { status: 400 });
    }

    // Export all user data
    const exportData: any = {
      export_date: new Date().toISOString(),
      user_email: request.user_email,
      request_type: request.request_type,
    };

    // 1. User info
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authUser) {
      exportData.user_info = {
        email: authUser.user.email,
        created_at: authUser.user.created_at,
        last_sign_in_at: authUser.user.last_sign_in_at,
      };
    }

    // 2. Household membership
    const { data: householdMembers } = await supabaseAdmin
      .from('household_members')
      .select(`
        display_name,
        role,
        joined_at,
        household:households(name, created_at)
      `)
      .eq('user_id', userId);

    exportData.households = householdMembers || [];

    if (request.household_id) {
      // 3. Children
      const { data: children } = await supabaseAdmin
        .from('children')
        .select('name, created_at')
        .eq('household_id', request.household_id);

      exportData.children = children || [];

      // 4. Schedule assignments
      const { data: schedules } = await supabaseAdmin
        .from('schedule_assignments')
        .select(`
          date,
          slot,
          assigned_member_id,
          household_members(display_name)
        `)
        .eq('household_id', request.household_id)
        .order('date', { ascending: false })
        .limit(365); // Last year

      exportData.schedule_assignments = schedules || [];

      // 5. Day notes
      const { data: notes } = await supabaseAdmin
        .from('day_notes')
        .select('date, content, created_at')
        .eq('household_id', request.household_id)
        .order('date', { ascending: false })
        .limit(365); // Last year

      exportData.day_notes = notes || [];

      // 6. Equipment status
      const { data: equipment } = await supabaseAdmin
        .from('equipment_status')
        .select(`
          item_key,
          status,
          updated_at,
          child:children(name)
        `)
        .in('child_id', (children || []).map(c => c.id));

      exportData.equipment_status = equipment || [];
    }

    // Return as JSON file
    const jsonString = JSON.stringify(exportData, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user_data_${request.user_email}_${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Export data error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
