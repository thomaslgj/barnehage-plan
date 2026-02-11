import { supabase } from './supabase';
import type { EquipmentItem, EquipmentStatus } from '../types/db';

// Default equipment items
export const DEFAULT_EQUIPMENT_ITEMS = [
  { key: 'rain_gear', label: 'Regntøy' },
  { key: 'change_clothes', label: 'Skiftetøy' },
  { key: 'wool', label: 'Ull' },
  { key: 'diapers', label: 'Bleier' },
];

// Fetch equipment status from database
export async function fetchEquipmentStatus(
  householdId: string
): Promise<EquipmentItem[]> {
  try {
    const { data, error } = await supabase
      .from('household_equipment_status')
      .select('item_key, status')
      .eq('household_id', householdId);

    if (error) throw error;

    // Merge default items with database data
    const statusMap = new Map<string, 'ok' | 'missing'>();
    data?.forEach((item: Pick<EquipmentStatus, 'item_key' | 'status'>) => {
      statusMap.set(item.item_key, item.status);
    });

    return DEFAULT_EQUIPMENT_ITEMS.map((item) => ({
      ...item,
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
  } catch (error) {
    console.error('Error updating equipment status:', error);
    throw error;
  }
}

// Calculate overall equipment status
export function calculateEquipmentStatus(items: EquipmentItem[]): 'ready' | 'missing' | 'not_ready' {
  const hasData = items.length > 0;
  if (!hasData) return 'not_ready';

  const hasMissing = items.some((item) => item.status === 'missing');
  return hasMissing ? 'missing' : 'ready';
}

// Check if equipment modal should be shown
// Show at or after 4 PM when viewing tomorrow
export function shouldShowEquipmentModal(
  date: string,
  lastShownDate: string | null
): boolean {
  const now = new Date();
  const currentHour = now.getHours();

  // Only show at or after 4 PM (16:00)
  if (currentHour < 16) return false;

  // Check if we're viewing tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (date !== tomorrowStr) return false;

  // Check if already shown today
  const today = now.toISOString().split('T')[0];
  if (lastShownDate === today) return false;

  return true;
}
