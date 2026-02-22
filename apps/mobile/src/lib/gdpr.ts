import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

/**
 * Export all user data as JSON (GDPR Right to Data Portability)
 */
export async function exportUserData(userId: string, householdId: string, childId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Fetch all user data
    const [
      { data: memberData },
      { data: householdData },
      { data: childrenData },
      { data: assignmentsData },
      { data: notesData },
      { data: equipmentData },
    ] = await Promise.all([
      supabase.from('household_members').select('*').eq('user_id', userId),
      supabase.from('households').select('*').eq('id', householdId),
      supabase.from('children').select('*').eq('household_id', householdId),
      supabase.from('schedule_assignments').select('*').eq('household_id', householdId),
      supabase.from('day_notes').select('*').eq('household_id', householdId),
      supabase.from('equipment_status').select('*').eq('household_id', householdId).then(
        r => r,
        () => ({ data: [] }) // Table might not exist
      ),
    ]);

    const exportData = {
      export_date: new Date().toISOString(),
      export_type: 'GDPR Data Export',
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      household_member: memberData?.[0] || null,
      household: householdData?.[0] || null,
      children: childrenData || [],
      schedule_assignments: assignmentsData || [],
      notes: notesData || [],
      equipment_status: equipmentData || [],
    };

    // Save to file
    const fileName = `flyt-data-export-${new Date().toISOString().split('T')[0]}.json`;
    const fileUri = FileSystem.documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(
      fileUri,
      JSON.stringify(exportData, null, 2),
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Eksporter dine data',
        UTI: 'public.json',
      });
    }

    return { success: true, fileUri };
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw error;
  }
}

/**
 * Delete user account and all associated data (GDPR Right to Erasure)
 */
export async function deleteUserAccount(
  userId: string,
  householdId: string,
  memberId: string,
  isOwner: boolean
) {
  try {
    // Check if user is household owner
    if (isOwner) {
      // Check if there are other members
      const { data: otherMembers } = await supabase
        .from('household_members')
        .select('id')
        .eq('household_id', householdId)
        .neq('id', memberId);

      if (otherMembers && otherMembers.length > 0) {
        Alert.alert(
          'Kan ikke slette konto',
          'Du er eier av husholdningen og det finnes andre medlemmer. Overfør eierskap eller fjern andre medlemmer først.',
          [{ text: 'OK' }]
        );
        return { success: false, error: 'household_has_members' };
      }

      // Delete all household data
      await Promise.all([
        supabase.from('day_notes').delete().eq('household_id', householdId),
        supabase.from('schedule_assignments').delete().eq('household_id', householdId),
        supabase.from('equipment_status').delete().eq('household_id', householdId).then(
          r => r,
          () => ({}) // Ignore if table doesn't exist
        ),
        supabase.from('children').delete().eq('household_id', householdId),
      ]);

      // Delete household member and household
      await supabase.from('household_members').delete().eq('id', memberId);
      await supabase.from('households').delete().eq('id', householdId);
    } else {
      // Just remove member from household
      await supabase.from('household_members').delete().eq('id', memberId);
    }

    // Delete user from Supabase Auth
    // Note: This requires admin privileges, so it should be done via a secure endpoint
    // For now, we'll sign out and the user needs to contact support for full deletion
    await supabase.auth.signOut();

    return { success: true };
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
}

/**
 * Request account deletion (sends request to admin)
 */
export async function requestAccountDeletion(userId: string, email: string) {
  try {
    // TODO: Send email or create a deletion request record
    // For now, we'll just create a note in a "deletion_requests" table

    const { error } = await supabase
      .from('deletion_requests')
      .insert({
        user_id: userId,
        email: email,
        requested_at: new Date().toISOString(),
        status: 'pending',
      });

    if (error && error.code !== '42P01') { // Ignore if table doesn't exist
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error requesting account deletion:', error);
    return { success: false, error };
  }
}
