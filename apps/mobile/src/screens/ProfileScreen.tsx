import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useHousehold } from '../contexts/HouseholdProvider';
import tw from '../lib/tw';
import { BackButton } from '../components/BackButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { Text } from '../components/Text';

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  action?: () => void;
  color?: string;
}

export default function ProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const { forceOnboarding } = useHousehold();

  const handleLogout = async () => {
    Alert.alert(
      'Logg ut',
      'Er du sikker på at du vil logge ut?',
      [
        {
          text: 'Avbryt',
          style: 'cancel',
        },
        {
          text: 'Logg ut',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Feil', 'Kunne ikke logge ut');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleOnboarding = () => {
    Alert.alert(
      'Kjør onboarding på nytt',
      'Dette vil la deg gå gjennom onboardingen på nytt og oppdatere innstillingene dine.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Kjør på nytt',
          onPress: () => {
            forceOnboarding();
            navigation.goBack();
          },
        },
      ]
    );
  };

  const menuItems: MenuItem[] = [
    {
      id: 'personal-info',
      title: 'Personlige opplysninger',
      icon: 'person-outline',
      route: 'PersonalInfo',
    },
    {
      id: 'notifications',
      title: 'Varslinger',
      icon: 'notifications-outline',
      route: 'NotificationsSettings',
    },
    {
      id: 'equipment',
      title: 'Utstyrsliste',
      icon: 'list-outline',
      route: 'EquipmentManagement',
    },
  ];

  const systemItems: MenuItem[] = [
    {
      id: 'onboarding',
      title: 'Kjør onboarding på nytt',
      icon: 'refresh-outline',
      action: handleOnboarding,
      color: 'text-secondary',
    },
    {
      id: 'logout',
      title: 'Logg ut',
      icon: 'log-out-outline',
      action: handleLogout,
      color: 'text-error',
    },
  ];

  const renderMenuItem = (item: MenuItem, isLast: boolean = false) => (
    <TouchableOpacity
      key={item.id}
      style={tw.style(
        'flex-row items-center justify-between py-4 px-5',
        !isLast && 'border-b border-slate-700/50'
      )}
      onPress={() => {
        if (item.route) {
          navigation.navigate(item.route);
        } else if (item.action) {
          item.action();
        }
      }}
      disabled={loading}
    >
      <View style={tw`flex-row items-center gap-3 flex-1`}>
        <Ionicons
          name={item.icon}
          size={24}
          color={item.color ? tw.color(item.color) : tw.color('text-text')}
        />
        <Text style={tw.style('text-base font-medium flex-1', item.color || 'text-text')}>
          {item.title}
        </Text>
      </View>
      <Text style={tw`text-text-light text-xl`}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={tw`flex-1 bg-background`}>
      <SafeAreaView style={tw`flex-1`} edges={['top']}>
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`p-4`}
        >
          <BackButton />

          <ScreenHeader title="Profil & Innstillinger" />

          {/* Main Menu Section */}
          <View style={tw`bg-slate-800/50 rounded-lg border border-slate-700 mb-4`}>
            {menuItems.map((item, index) =>
              renderMenuItem(item, index === menuItems.length - 1)
            )}
          </View>

          {/* System Actions Section */}
          <View style={tw`bg-slate-800/50 rounded-lg border border-slate-700`}>
            {systemItems.map((item, index) =>
              renderMenuItem(item, index === systemItems.length - 1)
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
