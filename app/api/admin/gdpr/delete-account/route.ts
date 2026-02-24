import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { requestId, userId } = await req.json();

    if (!requestId || !userId) {
      return NextResponse.json({ error: 'Request ID and user ID required' }, { status: 400 });
    }

    // Get user's households
    const { data: memberships } = await supabaseAdmin
      .from('household_members')
      .select('household_id')
      .eq('user_id', userId);

    if (!memberships || memberships.length === 0) {
      // User has no household, just delete auth user
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('Delete user error:', authError);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
      }

      // Mark request as completed
      await supabaseAdmin
        .from('gdpr_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          admin_notes: 'Account deleted (no household)',
          processed_by: 'admin',
        })
        .eq('id', requestId);

      return NextResponse.json({ success: true });
    }

    // Check if user is the only member of any household
    for (const membership of memberships) {
      const { data: householdMembers, error: membersError } = await supabaseAdmin
        .from('household_members')
        .select('id')
        .eq('household_id', membership.household_id);

      if (membersError) {
        console.error('Error fetching household members:', membersError);
        continue;
      }

      if (householdMembers && householdMembers.length === 1) {
        // User is the only member - delete entire household (will cascade)
        const { error: deleteError } = await supabaseAdmin
          .from('households')
          .delete()
          .eq('id', membership.household_id);

        if (deleteError) {
          console.error('Error deleting household:', deleteError);
          return NextResponse.json({
            error: `Failed to delete household ${membership.household_id}`
          }, { status: 500 });
        }
      } else {
        // Multiple members - just remove this user
        // First, reassign their schedule assignments
        await supabaseAdmin
          .from('schedule_assignments')
          .update({
            assigned_member_id: null,
            assigned_user_id: null,
          })
          .eq('assigned_user_id', userId);

        // Then delete their membership
        await supabaseAdmin
          .from('household_members')
          .delete()
          .eq('user_id', userId)
          .eq('household_id', membership.household_id);
      }
    }

    // Finally, delete auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Delete user error:', authError);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    // Mark request as completed
    await supabaseAdmin
      .from('gdpr_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        admin_notes: `Account deleted. ${memberships.length} household(s) processed.`,
        processed_by: 'admin',
      })
      .eq('id', requestId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to delete account'
    }, { status: 500 });
  }
}
