import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, ActivityIndicator, Switch, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useHousehold } from '../contexts/HouseholdProvider';
import tw from '../lib/tw';
import { BackButton } from '../components/BackButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { Text } from '../components/Text';
import {
  getNotificationSettings,
  saveNotificationSettings,
  scheduleEquipmentNotification,
  cancelAllEquipmentNotifications,
  requestNotificationPermissions,
  setupNotificationChannel,
  type NotificationSettings,
} from '../services/notifications';

export default function NotificationsSettingsScreen({ navigation }: any) {
  const { householdId, members, user } = useHousehold();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    time: '07:30',
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

  const currentMember = members.find(m => m.user_id === user?.id);

  // Load settings
  useEffect(() => {
    if (currentMember) {
      loadSettings();
    }
  }, [currentMember]);

  const loadSettings = async () => {
    if (!currentMember) return;

    try {
      const loadedSettings = await getNotificationSettings(currentMember.id);
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (value: boolean) => {
    if (!currentMember || !householdId) return;

    // Request permissions if enabling
    if (value) {
      const hasPermission = await requestNotificationPermissions();

      if (!hasPermission) {
        const settingsText = Platform.OS === 'ios'
          ? 'Gå til iOS Innstillinger → Expo Go → Varsler og aktiver tillatelser.'
          : 'Gå til Android Innstillinger → Apps → Expo Go → Notifications og aktiver tillatelser.';

        Alert.alert(
          'Tillatelse nødvendig',
          `Du må gi tillatelse til varslinger for å aktivere denne funksjonen.\n\n${settingsText}`
        );
        return;
      }

      await setupNotificationChannel();
    }

    const newSettings = { ...settings, enabled: value };
    setSettings(newSettings);

    setSaving(true);
    try {
      await saveNotificationSettings(currentMember.id, newSettings);

      if (value) {
        const notificationId = await scheduleEquipmentNotification(householdId, settings.time);

        if (notificationId) {
          Alert.alert(
            'Aktivert ✅',
            'Du vil nå motta daglige påminnelser om utstyr.\n\nMerk: Lukk appen for å se notifikasjoner.'
          );
        } else {
          Alert.alert(
            'Aktivert',
            'Innstillinger lagret, men varslinger kunne ikke aktiveres.'
          );
        }
      } else {
        await cancelAllEquipmentNotifications();
        Alert.alert('Deaktivert', 'Varsler er deaktivert');
      }

    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Feil', 'Kunne ikke oppdatere innstillinger');
      // Revert on error
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios'); // Keep open on iOS

    if (event.type === 'dismissed') {
      return;
    }

    if (selectedDate && currentMember && householdId) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      const newSettings = { ...settings, time: timeString };
      setSettings(newSettings);

      setSaving(true);
      try {
        await saveNotificationSettings(currentMember.id, newSettings);

        if (settings.enabled) {
          // Reschedule notification with new time
          // This will cancel old notifications and schedule new ones
          await scheduleEquipmentNotification(householdId, timeString);
          Alert.alert(
            'Lagret',
            `Varslingstidspunkt endret til ${timeString}. Eksisterende varslinger er oppdatert.`
          );
        } else {
          Alert.alert('Lagret', `Varslingstidspunkt endret til ${timeString}`);
        }
      } catch (error) {
        console.error('Error updating time:', error);
        Alert.alert('Feil', 'Kunne ikke oppdatere tidspunkt');
        // Revert on error
        setSettings(settings);
      } finally {
        setSaving(false);
      }
    }
  };

  const getTimeAsDate = () => {
    const [hours, minutes] = settings.time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-background`}>
        <ActivityIndicator size="large" color="#7fa884" />
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-background`}>
      <SafeAreaView style={tw`flex-1`} edges={['top']}>
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`p-4`}
        >
          <BackButton />

          <ScreenHeader
            title="Varslinger"
            subtitle="Få daglige påminnelser om utstyr til barnehagen"
          />

          {/* Enable/Disable Toggle */}
          <View style={tw`bg-slate-800/50 rounded-lg p-4 border border-slate-700 mb-4`}>
            <View style={tw`flex-row items-center justify-between`}>
              <View style={tw`flex-1 pr-4`}>
                <Text style={tw`text-base text-white font-medium mb-1`}>
                  Daglige påminnelser
                </Text>
                <Text style={tw`text-sm text-text-muted`}>
                  Få varsel hvis kritisk utstyr mangler
                </Text>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={handleToggleEnabled}
                disabled={saving}
                trackColor={{ false: '#4a3f38', true: '#6b8e6f' }}
                thumbColor={settings.enabled ? '#7fa884' : '#8b7a6a'}
              />
            </View>
          </View>

          {/* Time Picker */}
          {settings.enabled && (
            <View style={tw`bg-slate-800/50 rounded-lg p-4 border border-slate-700 mb-4`}>
              <Text style={[tw`text-sm text-text-muted mb-3`, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
                Tidspunkt for varsling
              </Text>
              <TouchableOpacity
                style={tw`flex-row items-center justify-between bg-background border border-slate-700 rounded-lg px-4 py-3`}
                onPress={() => setShowTimePicker(true)}
                disabled={saving}
              >
                <Text style={tw`text-base text-white`}>
                  {settings.time}
                </Text>
                <Text style={tw`text-text-light text-xl`}>›</Text>
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={getTimeAsDate()}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </View>
          )}

          {/* Info Section */}
          <View style={tw`bg-info/10 rounded-lg p-4 border border-info/30`}>
            <Text style={tw`text-sm text-slate-200 mb-2 font-medium`}>
              💡 Om varslinger
            </Text>
            <Text style={tw`text-sm text-slate-300`}>
              Du får varsling hver morgen på det valgte tidspunktet hvis du har kritisk utstyr som mangler. Dette hjelper deg å huske å ta med det som er nødvendig til barnehagen.
            </Text>
          </View>

          {saving && (
            <View style={tw`mt-4 flex-row items-center justify-center gap-2`}>
              <ActivityIndicator size="small" color="#7fa884" />
              <Text style={tw`text-text-muted text-sm`}>
                Lagrer...
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
