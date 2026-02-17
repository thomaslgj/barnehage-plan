import React from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from './Text';
import Avatar from './Avatar';
import { AVAILABLE_AVATARS } from '../lib/avatars';
import tw from '../lib/tw';

interface AvatarPickerProps {
  selectedAvatarId: string | null;
  onSelect: (avatarId: string) => void;
}

export default function AvatarPicker({ selectedAvatarId, onSelect }: AvatarPickerProps) {
  return (
    <View style={tw`w-full`}>
      <Text style={tw`text-base text-text mb-3 font-medium`}>Velg avatar</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tw`gap-3`}
      >
        {AVAILABLE_AVATARS.map((avatarId) => (
          <TouchableOpacity
            key={avatarId}
            onPress={() => onSelect(avatarId)}
            style={[
              tw`p-2 rounded-xl border-2`,
              selectedAvatarId === avatarId
                ? tw`border-primary bg-primary/10`
                : tw`border-slate-700 bg-slate-800/30`
            ]}
            activeOpacity={0.7}
          >
            <Avatar avatarId={avatarId} size={56} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
