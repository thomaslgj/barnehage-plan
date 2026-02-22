import { supabase } from './supabase';
import type { EquipmentItem, EquipmentStatus } from '../types/db';
import { rescheduleNotificationIfNeeded } from '../services/notifications';

// Default equipment items
export const DEFAULT_EQUIPMENT_ITEMS = [
  { key: 'rain_gear', label: 'Regntøy', is_critical: true },
  { key: 'change_clothes', label: 'Skiftetøy', is_critical: false },
  { key: 'wool', label: 'Ull', is_critical: false },
  { key: 'diapers', label: 'Bleier', is_critical: true },
];

// Fetch equipment status from database
export async function fetchEquipmentStatus(
  householdId: string
): Promise<EquipmentItem[]> {
  try {
    // Fetch actual equipment items from database
    const { data: equipmentItems, error: itemsError } = await supabase
      .from('equipment_items')
      .select('key, label, is_critical')
      .eq('household_id', householdId)
      .eq('active', true)
      .order('sort_order');

    if (itemsError) throw itemsError;

    // If no items found, use defaults
    const items = equipmentItems && equipmentItems.length > 0
      ? equipmentItems
      : DEFAULT_EQUIPMENT_ITEMS;

    // Fetch status for each item
    const { data: statusData, error: statusError } = await supabase
      .from('household_equipment_status')
      .select('item_key, status')
      .eq('household_id', householdId);

    if (statusError) throw statusError;

    // Merge items with status
    const statusMap = new Map<string, 'ok' | 'missing'>();
    statusData?.forEach((item: Pick<EquipmentStatus, 'item_key' | 'status'>) => {
      statusMap.set(item.item_key, item.status);
    });

    return items.map((item) => ({
      key: item.key,
      label: item.label,
      is_critical: item.is_critical ?? false,
      status: statusMap.get(item.key) || 'ok',
    }));
  } catch (error) {
    console.error('Error fetching equipment status:', error);
    // Return default items with 'ok' status on error
    return DEFAULT_EQUIPMENT_ITEMS.map((item) => ({ ...item, status: 'ok' as const }));
  }
}

// Update equipment status in database
export async function updateEquipmentStatus(
  householdId: string,
  userId: string,
  itemKey: string,
  status: 'ok' | 'missing'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('household_equipment_status')
      .upsert(
        {
          household_id: householdId,
          item_key: itemKey,
          status: status,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'household_id,item_key' }
      );

    if (error) throw error;

    // Reschedule notification after status change (especially useful for Android)
    // Get member ID from user ID
    const { data: memberData } = await supabase
      .from('household_members')
      .select('id')
      .eq('user_id', userId)
      .eq('household_id', householdId)
      .single();

    if (memberData) {
      // Fire and forget - don't wait for this to complete
      rescheduleNotificationIfNeeded(householdId, memberData.id).catch(err => {
        console.error('Failed to reschedule notification:', err);
      });
    }
  } catch (error) {
    console.error('Error updating equipment status:', error);
    throw error;
  }
}

// Calculate overall equipment status
// Critical items missing → not_ready (red)
// Non-critical items missing → missing (yellow)
// Nothing missing → ready (green)
export function calculateEquipmentStatus(items: EquipmentItem[]): 'ready' | 'missing' | 'not_ready' {
  const hasData = items.length > 0;
  if (!hasData) return 'not_ready';

  // Find all missing items
  const allMissing = items.filter((item) => item.status === 'missing');

  // Check if any critical items are missing
  const missingCritical = allMissing.filter((item) => item.is_critical);

  if (missingCritical.length > 0) {
    return 'not_ready'; // Red status
  }

  // Check if any non-critical items are missing
  const missingNonCritical = allMissing.filter((item) => !item.is_critical);

  if (missingNonCritical.length > 0) {
    return 'missing'; // Yellow status
  }

  // All items are OK
  return 'ready'; // Green status
}

// Check if equipment modal should be shown
// Show at or after 4 PM when viewing tomorrow
export function shouldShowEquipmentModal(
  date: string,
  lastShownDate: string | null
): boolean {
  const now = new Date();
  const currentHour = now.getHours();

  // Don't show on weekends at all (Saturday = 6, Sunday = 0)
  const todayDayOfWeek = now.getDay();
  if (todayDayOfWeek === 0 || todayDayOfWeek === 6) return false;

  // Only show at or after 4 PM (16:00)
  if (currentHour < 16) return false;

  // Check if we're viewing tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (date !== tomorrowStr) return false;

  // Don't show if tomorrow is a weekend (Saturday = 6, Sunday = 0)
  const tomorrowDayOfWeek = tomorrow.getDay();
  if (tomorrowDayOfWeek === 0 || tomorrowDayOfWeek === 6) return false;

  // Check if already shown today
  const today = now.toISOString().split('T')[0];
  if (lastShownDate === today) return false;

  return true;
}
