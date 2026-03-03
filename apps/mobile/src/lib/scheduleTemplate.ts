import { supabase } from './supabase';
import { getAssignments } from '../stores/assignments-store';

interface DayInfo {
  dateStr: string;
  isoWeekday: number;
}

interface ApplyTemplateParams {
  childId: string;
  householdId: string;
  userId: string;
  days: DayInfo[];
}

interface ApplyTemplateResult {
  applied: boolean;
  hasTemplate: boolean;
}

export async function applyTemplateToWeek({
  childId,
  householdId,
  userId,
  days,
}: ApplyTemplateParams): Promise<ApplyTemplateResult> {
  try {
    const { data: templates, error: templateError } = await supabase
      .from('schedule_templates')
      .select('weekday, slot, assigned_member_id, assigned_user_id')
      .eq('household_id', householdId)
      .eq('child_id', childId);

    if (templateError) {
      console.error('Template error:', templateError);
      return { applied: false, hasTemplate: false };
    }

    if (!templates || templates.length === 0) {
      return { applied: false, hasTemplate: false };
    }

    const newAssignments: Array<{
      household_id: string;
      child_id: string;
      date: string;
      slot: 'dropoff' | 'pickup';
      assigned_member_id: string | null;
      assigned_user_id: string | null;
      updated_by: string;
    }> = [];

    const currentAssignments = getAssignments();
    for (const day of days) {
      // Check dropoff
      const dropoffKey = `${day.dateStr}-dropoff`;
      if (!currentAssignments[dropoffKey]) {
        const template = templates.find(t => t.weekday === day.isoWeekday && t.slot === 'dropoff');
        if (template?.assigned_member_id) {
          newAssignments.push({
            household_id: householdId,
            child_id: childId,
            date: day.dateStr,
            slot: 'dropoff',
            assigned_member_id: template.assigned_member_id,
            assigned_user_id: template.assigned_user_id,
            updated_by: userId,
          });
        }
      }

      // Check pickup
      const pickupKey = `${day.dateStr}-pickup`;
      if (!currentAssignments[pickupKey]) {
        const template = templates.find(t => t.weekday === day.isoWeekday && t.slot === 'pickup');
        if (template?.assigned_member_id) {
          newAssignments.push({
            household_id: householdId,
            child_id: childId,
            date: day.dateStr,
            slot: 'pickup',
            assigned_member_id: template.assigned_member_id,
            assigned_user_id: template.assigned_user_id,
            updated_by: userId,
          });
        }
      }
    }

    if (newAssignments.length === 0) {
      return { applied: false, hasTemplate: true };
    }

    const { error: upsertError } = await supabase
      .from('schedule_assignments')
      .upsert(newAssignments, { onConflict: 'child_id,date,slot' });

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return { applied: false, hasTemplate: true };
    }

    return { applied: true, hasTemplate: true };
  } catch (error) {
    console.error('Error applying template:', error);
    return { applied: false, hasTemplate: false };
  }
}
