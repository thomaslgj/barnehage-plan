import React from 'react';
import { View } from 'react-native';
import Skeleton from './Skeleton';
import tw from '../lib/tw';

export default function TodayCardSkeleton() {
  return (
    <View style={tw`bg-slate-800/50 rounded-xl p-5 mb-6 border border-slate-700/50`}>
      {/* Collapsed state - everything on one line */}
      <View style={tw`flex-row items-center gap-3`}>
        {/* Title */}
        <Skeleton width={80} height={24} />

        {/* Avatar 1 */}
        <Skeleton width={36} height={36} borderRadius={18} />

        {/* Avatar 2 */}
        <Skeleton width={36} height={36} borderRadius={18} />

        {/* Note icon placeholder */}
        <Skeleton width={18} height={18} borderRadius={4} />

        {/* Equipment status icon placeholder */}
        <Skeleton width={22} height={22} borderRadius={11} />

        {/* Chevron icon placeholder */}
        <View style={tw`ml-auto`}>
          <Skeleton width={20} height={20} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}
