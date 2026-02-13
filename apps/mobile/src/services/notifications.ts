import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configure how notifications are displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  time: string; // Format: "HH:MM"
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false; // Notifications not supported on web
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Set up notification channel for Android
 */
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('equipment-reminders', {
      name: 'Utstyrs-påminnelser',
      description: 'Daglige påminnelser om utstyr til barnehagen',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
}

/**
 * Check if any critical equipment is missing
 */
async function hasMissingCriticalEquipment(householdId: string): Promise<boolean> {
  try {
    // Get all critical equipment items for this household
    const { data: equipmentItems, error: equipmentError } = await supabase
      .from('equipment_items')
      .select('key, is_critical')
      .eq('household_id', householdId)
      .eq('active', true)
      .eq('is_critical', true);

    if (equipmentError) throw equipmentError;

    if (!equipmentItems || equipmentItems.length === 0) {
      return false; // No critical items defined
    }

    // Get status for all items in one query (table name is household_equipment_status)
    const { data: statusData, error: statusError } = await supabase
      .from('household_equipment_status')
      .select('item_key, status')
      .eq('household_id', householdId)
      .in('item_key', equipmentItems.map(item => item.key));

    if (statusError) throw statusError;

    // Create status map
    const statusMap = new Map<string, string>();
    statusData?.forEach((item: any) => {
      statusMap.set(item.item_key, item.status);
    });

    // Check if any critical item is missing
    for (const item of equipmentItems) {
      const status = statusMap.get(item.key);
      // If no status record exists, assume OK. If status is 'missing', return true
      if (status === 'missing') {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking critical equipment:', error);
    return false;
  }
}

/**
 * Schedule daily equipment check notification
 */
export async function scheduleEquipmentNotification(
  householdId: string,
  time: string // Format: "HH:MM"
): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    // Cancel any existing equipment notifications before scheduling new ones
    console.log('Cancelling existing notifications before rescheduling...');
    await cancelAllEquipmentNotifications();

    // Parse time
    const [hours, minutes] = time.split(':').map(Number);

    // Calculate next occurrence of the notification time
    const now = new Date();
    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (scheduledDate <= now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    // Create trigger based on platform
    let trigger: any;

    if (Platform.OS === 'android') {
      // Android: use date-based trigger with daily repeating
      // Calculate time until first trigger
      const timeUntilTrigger = Math.floor((scheduledDate.getTime() - now.getTime()) / 1000);

      // Use time interval trigger that repeats every 24 hours
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: timeUntilTrigger,
        repeats: false, // We'll reschedule after it fires
      };
    } else {
      // iOS: use calendar trigger
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: hours,
        minute: minutes,
        repeats: true,
      };
    }

    // Check if critical equipment is missing right now
    const hasMissing = await hasMissingCriticalEquipment(householdId);

    // Schedule notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Utstyr til barnehagen 🎒',
        body: hasMissing
          ? 'Du mangler viktig utstyr! Sjekk hva som må tas med.'
          : 'Husk å sjekke at du har alt utstyr til barnehagen.',
        data: { type: 'equipment-reminder', householdId, time },
        sound: 'default',
      },
      trigger,
    });

    console.log(`Notification scheduled for ${scheduledDate.toLocaleString()}, ID: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel all equipment notifications
 */
export async function cancelAllEquipmentNotifications() {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
      if (notification.content.data?.type === 'equipment-reminder') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
}

/**
 * Get notification settings from database
 */
export async function getNotificationSettings(memberId: string): Promise<NotificationSettings> {
  try {
    const { data, error } = await supabase
      .from('household_members')
      .select('notification_enabled, notification_time')
      .eq('id', memberId)
      .single();

    if (error) throw error;

    return {
      enabled: data?.notification_enabled ?? true,
      time: data?.notification_time ?? '07:30',
    };
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return {
      enabled: true,
      time: '07:30',
    };
  }
}

/**
 * Save notification settings to database
 */
export async function saveNotificationSettings(
  memberId: string,
  settings: NotificationSettings
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('household_members')
      .update({
        notification_enabled: settings.enabled,
        notification_time: settings.time,
      })
      .eq('id', memberId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving notification settings:', error);
    return false;
  }
}

/**
 * Reschedule notification after equipment status change (useful for Android)
 * Call this whenever equipment status is updated
 */
export async function rescheduleNotificationIfNeeded(
  householdId: string,
  memberId: string
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    // Get notification settings
    const settings = await getNotificationSettings(memberId);

    // Only reschedule if notifications are enabled
    if (!settings.enabled) {
      return;
    }

    // Check if critical equipment is missing
    const hasMissing = await hasMissingCriticalEquipment(householdId);

    // For Android: always reschedule to ensure it fires at the correct time tomorrow
    // For iOS: calendar trigger handles this automatically, but we reschedule anyway to update the message
    if (Platform.OS === 'android' || hasMissing) {
      await scheduleEquipmentNotification(householdId, settings.time);
      console.log('Notification rescheduled after equipment status change');
    }
  } catch (error) {
    console.error('Error rescheduling notification:', error);
  }
}
