'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export async function resendInvite(memberId: string) {
  try {
    // Get member details
    const { data: member, error: memberError } = await supabaseAdmin
      .from('household_members')
      .select('*, household:households(name)')
      .eq('id', memberId)
      .single();

    if (memberError || !member) {
      return { success: false, error: 'Kunne ikke finne bruker' };
    }

    // For now, we'll return instructions to manually invite
    // In a production app, you would:
    // 1. Generate a magic link or reset password
    // 2. Send an email with the link
    // 3. Use Supabase Auth Admin API: supabase.auth.admin.inviteUserByEmail()

    // TODO: Implement actual email sending
    // This requires setting up email templates in Supabase or using a service like SendGrid

    return {
      success: true,
      message: 'Invitasjon ville bli sendt (email-funksjonalitet må implementeres)'
    };
  } catch (error) {
    console.error('Error resending invite:', error);
    return { success: false, error: 'Ukjent feil' };
  }
}

export async function deleteUser(memberId: string, userId: string | null) {
  try {
    // Get household info before deleting
    const { data: member, error: memberError } = await supabaseAdmin
      .from('household_members')
      .select('household_id, role')
      .eq('id', memberId)
      .single();

    if (memberError || !member) {
      return { success: false, error: 'Kunne ikke finne bruker' };
    }

    // Check if this is the household owner
    if (member.role === 'owner') {
      // Check if there are other members
      const { data: otherMembers } = await supabaseAdmin
        .from('household_members')
        .select('id')
        .eq('household_id', member.household_id)
        .neq('id', memberId);

      if (otherMembers && otherMembers.length > 0) {
        return {
          success: false,
          error: 'Kan ikke slette eier av hushold som har andre medlemmer. Slett andre medlemmer først eller overfør eierskap.'
        };
      }

      // If owner and no other members, we can delete the whole household
      // First delete children
      await supabaseAdmin
        .from('children')
        .delete()
        .eq('household_id', member.household_id);

      // Delete schedule assignments
      await supabaseAdmin
        .from('schedule_assignments')
        .delete()
        .eq('household_id', member.household_id);

      // Delete day notes if table exists
      await supabaseAdmin
        .from('day_notes')
        .delete()
        .eq('household_id', member.household_id)
        .then(() => {}, () => {}); // Ignore errors if table doesn't exist

      // Delete equipment status if table exists
      await supabaseAdmin
        .from('equipment_status')
        .delete()
        .eq('household_id', member.household_id)
        .then(() => {}, () => {}); // Ignore errors if table doesn't exist

      // Delete household member
      await supabaseAdmin
        .from('household_members')
        .delete()
        .eq('id', memberId);

      // Delete household
      await supabaseAdmin
        .from('households')
        .delete()
        .eq('id', member.household_id);
    } else {
      // Just delete the member if not owner
      await supabaseAdmin
        .from('household_members')
        .delete()
        .eq('id', memberId);
    }

    // Delete from auth.users if user_id exists
    if (userId) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Kunne ikke slette bruker' };
  }
}
