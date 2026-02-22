import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

/**
 * Notification Service for Equipment Reminders
 *
 * NOTE: When running in Expo Go, you'll see console warnings:
 * - "ERROR expo-notifications: Android Push notifications... was removed from Expo Go"
 * - "WARN `expo-notifications` functionality is not fully supported in Expo Go"
 *
 * These warnings can be SAFELY IGNORED. They refer to remote push notifications (from server),
 * which are not supported in Expo Go. However, LOCAL SCHEDULED NOTIFICATIONS (which this
 * service uses) work perfectly fine in Expo Go.
 *
 * For more details, see: docs/NOTIFICATIONS.md
 */

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
    console.log('Notifications not supported on web');
    return false; // Notifications not supported on web
  }

  console.log('\n=== CHECKING NOTIFICATION PERMISSIONS ===');
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log(`Existing permission status: ${existingStatus}`);

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    console.log('Permission not granted, requesting...');
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log(`New permission status: ${finalStatus}`);
  }

  const granted = finalStatus === 'granted';
  console.log(`Final result: ${granted ? '✅ GRANTED' : '❌ DENIED'}`);
  console.log('=== END PERMISSION CHECK ===\n');

  return granted;
}

/**
 * Set up notification channel for Android
 */
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    console.log('\n=== SETTING UP ANDROID NOTIFICATION CHANNEL ===');
    try {
      await Notifications.setNotificationChannelAsync('equipment-reminders', {
        name: 'Utstyrs-påminnelser',
        description: 'Daglige påminnelser om utstyr til barnehagen',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
      console.log('✅ Channel created successfully');
      console.log('=== END CHANNEL SETUP ===\n');
    } catch (error) {
      console.error('❌ Error creating channel:', error);
      console.log('=== END CHANNEL SETUP (FAILED) ===\n');
      throw error;
    }
  } else {
    console.log('Not Android, skipping channel setup');
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
    console.log('Notifications not supported on web');
    return null;
  }

  try {
    console.log(`\n=== SCHEDULING EQUIPMENT NOTIFICATION ===`);
    console.log(`Platform: ${Platform.OS}`);
    console.log(`Time: ${time}`);
    console.log(`Household ID: ${householdId}`);

    // Cancel any existing equipment notifications before scheduling new ones
    console.log('Cancelling existing notifications before rescheduling...');
    await cancelAllEquipmentNotifications();

    // Parse time
    const [hours, minutes] = time.split(':').map(Number);
    console.log(`Parsed time: ${hours}:${minutes}`);

    // Calculate next occurrence of the notification time
    const now = new Date();
    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0);

    console.log(`Current time: ${now.toLocaleString()}`);
    console.log(`Target time today: ${scheduledDate.toLocaleString()}`);

    // If the time has already passed today, schedule for tomorrow
    if (scheduledDate <= now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
      console.log(`Time has passed today, rescheduling for tomorrow: ${scheduledDate.toLocaleString()}`);
    } else {
      console.log(`Scheduling for today: ${scheduledDate.toLocaleString()}`);
    }

    // Skip weekends - if the scheduled date is Saturday (6) or Sunday (0), move to next Monday
    let dayOfWeek = scheduledDate.getDay();
    if (dayOfWeek === 0) {
      // Sunday - move to Monday
      scheduledDate.setDate(scheduledDate.getDate() + 1);
      console.log(`Sunday detected, moving to Monday: ${scheduledDate.toLocaleString()}`);
    } else if (dayOfWeek === 6) {
      // Saturday - move to Monday
      scheduledDate.setDate(scheduledDate.getDate() + 2);
      console.log(`Saturday detected, moving to Monday: ${scheduledDate.toLocaleString()}`);
    }

    // Create trigger based on platform
    let trigger: any;
    let notificationIds: string[] = [];

    if (Platform.OS === 'android') {
      // Android: use time interval trigger for next weekday
      const timeUntilTrigger = Math.floor((scheduledDate.getTime() - now.getTime()) / 1000);
      console.log(`Seconds until trigger: ${timeUntilTrigger} (${Math.floor(timeUntilTrigger / 60)} minutes)`);

      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: timeUntilTrigger,
        repeats: false, // We'll reschedule after it fires
      };
      console.log('Using TIME_INTERVAL trigger (Android)');
    } else {
      // iOS: schedule 5 separate notifications, one for each weekday (Monday-Friday)
      // This ensures notifications only fire on weekdays
      console.log('Using CALENDAR trigger (iOS) - scheduling for weekdays only');
    }

    console.log('Trigger config:', JSON.stringify(trigger, null, 2));

    // Check if critical equipment is missing right now
    const hasMissing = await hasMissingCriticalEquipment(householdId);
    console.log(`Has missing critical equipment: ${hasMissing}`);

    // Prepare notification content
    const content: any = {
      title: 'Utstyr til barnehagen 🎒',
      body: hasMissing
        ? 'Du mangler viktig utstyr! Sjekk hva som må tas med.'
        : 'Husk å sjekke at du har alt utstyr til barnehagen.',
      data: { type: 'equipment-reminder', householdId, time },
      sound: 'default',
    };

    // Add Android-specific channel ID
    if (Platform.OS === 'android') {
      content.channelId = 'equipment-reminders';
      console.log('Added Android channelId: equipment-reminders');
    }

    // Schedule notification(s)
    console.log('Calling scheduleNotificationAsync...');

    if (Platform.OS === 'ios') {
      // iOS: Schedule 5 notifications, one for each weekday
      // weekday: 1 = Sunday, 2 = Monday, 3 = Tuesday, 4 = Wednesday, 5 = Thursday, 6 = Friday, 7 = Saturday
      const weekdays = [2, 3, 4, 5, 6]; // Monday through Friday

      for (const weekday of weekdays) {
        const weekdayTrigger = {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: hours,
          minute: minutes,
          weekday: weekday,
          repeats: true,
        };

        const notificationId = await Notifications.scheduleNotificationAsync({
          content,
          trigger: weekdayTrigger,
        });

        notificationIds.push(notificationId);
        console.log(`✅ Scheduled for weekday ${weekday}, ID: ${notificationId}`);
      }

      console.log(`✅ SUCCESS: ${notificationIds.length} notifications scheduled for weekdays`);
      console.log(`=== END SCHEDULING ===\n`);
      return notificationIds[0]; // Return first ID for compatibility
    } else {
      // Android: Schedule single notification for next weekday
      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger,
      });

      console.log(`✅ SUCCESS: Notification scheduled for ${scheduledDate.toLocaleString()}, ID: ${notificationId}`);
      console.log(`=== END SCHEDULING ===\n`);
      return notificationId;
    }
  } catch (error) {
    console.error('\n❌ ERROR SCHEDULING NOTIFICATION:');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Full error:', error);
    console.error(`=== END SCHEDULING (FAILED) ===\n`);
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
    console.log(`Found ${scheduledNotifications.length} total scheduled notifications`);

    let cancelledCount = 0;
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.type === 'equipment-reminder') {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        cancelledCount++;
      }
    }
    console.log(`Cancelled ${cancelledCount} equipment notifications`);
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
}

/**
 * Get all scheduled equipment notifications (for debugging)
 */
export async function getScheduledNotifications() {
  if (Platform.OS === 'web') {
    return [];
  }

  try {
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const equipmentNotifications = allNotifications.filter(
      n => n.content.data?.type === 'equipment-reminder'
    );
    console.log('Scheduled equipment notifications:', equipmentNotifications);
    return equipmentNotifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

/**
 * Test notification (fires in 10 seconds)
 */
export async function scheduleTestNotification(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    console.log('\n=== SCHEDULING TEST NOTIFICATION ===');
    console.log('Platform:', Platform.OS);
    console.log('Scheduling test notification in 10 seconds...');

    const content: any = {
      title: 'Test Notification 🔔',
      body: 'Hvis du ser denne, fungerer notifications!',
      data: { type: 'test' },
      sound: 'default',
    };

    // Add Android-specific channel ID
    if (Platform.OS === 'android') {
      content.channelId = 'equipment-reminders';
      console.log('Added Android channelId: equipment-reminders');
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 10,
      },
    });

    console.log(`✅ Test notification scheduled with ID: ${notificationId}`);
    console.log('=== END TEST SCHEDULING ===\n');
    return notificationId;
  } catch (error) {
    console.error('❌ Error scheduling test notification:');
    console.error('Full error:', error);
    console.error('=== END TEST SCHEDULING (FAILED) ===\n');
    return null;
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

    // For Android: always reschedule to ensure it fires at the correct time on next weekday
    // (TIME_INTERVAL trigger doesn't repeat automatically)
    // For iOS: reschedule to update the notification message with current equipment status
    // (5 CALENDAR triggers repeat automatically for Mon-Fri, but message is fixed at scheduling time)
    if (Platform.OS === 'android' || hasMissing) {
      await scheduleEquipmentNotification(householdId, settings.time);
      console.log('Notification rescheduled after equipment status change');
    }
  } catch (error) {
    console.error('Error rescheduling notification:', error);
  }
}
