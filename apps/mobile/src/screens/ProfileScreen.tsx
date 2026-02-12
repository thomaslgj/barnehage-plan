import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from '../lib/tw';

export default function ProfileScreen({ navigation }: any) {
  return (
    <View style={tw`flex-1 bg-background`}>
      <SafeAreaView style={tw`flex-1`} edges={['top']}>
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`p-4`}
        >
        {/* Back button */}
        <TouchableOpacity
          style={tw`flex-row items-center gap-2 mb-6`}
          onPress={() => navigation.goBack()}
        >
          <Text style={tw`text-2xl text-slate-400`}>‹</Text>
          <Text style={tw`text-base text-slate-400`}>Tilbake</Text>
        </TouchableOpacity>

        <Text style={tw`text-3xl font-bold text-white mb-6`}>Profil & Innstillinger</Text>

        <View style={tw`bg-slate-800/50 rounded-lg p-4 mb-4`}>
          <Text style={tw`text-slate-300 text-center`}>
            Coming soon... 🚧
          </Text>
        </View>

        <Text style={tw`text-sm text-slate-400 text-center mt-8`}>
          Her kommer profil og innstillinger
        </Text>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}
