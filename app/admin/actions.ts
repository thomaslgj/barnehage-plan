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

export async function togglePremium(memberId: string, isPremium: boolean) {
  try {
    const { error } = await supabaseAdmin
      .from('household_members')
      .update({ is_premium: isPremium })
      .eq('id', memberId);

    if (error) {
      console.error('Error toggling premium:', error);
      return { success: false, error: 'Kunne ikke oppdatere premium status' };
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error toggling premium:', error);
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
      // No household member found by member ID - user exists in auth but hasn't onboarded
      if (userId) {
        // Clean up any orphaned references to this user before deleting from auth
        // First find any households created by this user
        const { data: ownedHouseholds } = await supabaseAdmin
          .from('households')
          .select('id')
          .eq('created_by', userId);

        // Delete all data for owned households
        if (ownedHouseholds && ownedHouseholds.length > 0) {
          for (const h of ownedHouseholds) {
            const { data: hChildren } = await supabaseAdmin.from('children').select('id').eq('household_id', h.id);
            await supabaseAdmin.from('schedule_assignments').delete().eq('household_id', h.id);
            await supabaseAdmin.from('schedule_templates').delete().eq('household_id', h.id);
            await supabaseAdmin.from('day_notes').delete().eq('household_id', h.id).then(() => {}, () => {});
            await supabaseAdmin.from('equipment_items').delete().eq('household_id', h.id).then(() => {}, () => {});
            if (hChildren) {
              for (const c of hChildren) {
                await supabaseAdmin.from('equipment_status').delete().eq('child_id', c.id).then(() => {}, () => {});
              }
            }
            await supabaseAdmin.from('children').delete().eq('household_id', h.id);
            await supabaseAdmin.from('household_members').delete().eq('household_id', h.id);
            await supabaseAdmin.from('households').delete().eq('id', h.id);
          }
        }

        // Also clean up any remaining direct references
        await supabaseAdmin.from('household_members').delete().eq('user_id', userId);
        // Nullify assigned_user_id references instead of deleting assignments
        await supabaseAdmin.from('schedule_assignments').update({ assigned_user_id: null }).eq('assigned_user_id', userId).then(() => {}, () => {});
        await supabaseAdmin.from('schedule_templates').update({ assigned_user_id: null }).eq('assigned_user_id', userId).then(() => {}, () => {});

        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (authDeleteError) {
          console.error('Error deleting auth user:', authDeleteError);
          return { success: false, error: `Kunne ikke slette auth-bruker: ${authDeleteError.message}` };
        }
        revalidatePath('/admin');
        return { success: true };
      }
      return { success: false, error: 'Kunne ikke finne bruker' };
    }

    const householdId = member.household_id;

    // Get all members with auth accounts in this household (for auth deletion)
    const { data: allMembers } = await supabaseAdmin
      .from('household_members')
      .select('id, user_id')
      .eq('household_id', householdId);

    // Delete all household data
    const deletions = [
      supabaseAdmin.from('schedule_assignments').delete().eq('household_id', householdId),
      supabaseAdmin.from('schedule_templates').delete().eq('household_id', householdId),
      supabaseAdmin.from('day_notes').delete().eq('household_id', householdId).then(() => {}, () => {}),
      supabaseAdmin.from('equipment_items').delete().eq('household_id', householdId).then(() => {}, () => {}),
    ];

    // Delete equipment_status by child_id (get children first)
    const { data: children } = await supabaseAdmin
      .from('children')
      .select('id')
      .eq('household_id', householdId);

    if (children) {
      for (const child of children) {
        deletions.push(
          supabaseAdmin.from('equipment_status').delete().eq('child_id', child.id).then(() => {}, () => {})
        );
      }
    }

    await Promise.all(deletions);

    // Delete children
    await supabaseAdmin.from('children').delete().eq('household_id', householdId);

    // Delete all household members (including partner placeholders)
    await supabaseAdmin.from('household_members').delete().eq('household_id', householdId);

    // Delete household
    await supabaseAdmin.from('households').delete().eq('id', householdId);

    // Delete all auth users from this household
    if (allMembers) {
      for (const m of allMembers) {
        if (m.user_id) {
          const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(m.user_id);
          if (authError) {
            console.error(`Error deleting auth user ${m.user_id}:`, authError);
          }
        }
      }
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Kunne ikke slette bruker' };
  }
}
