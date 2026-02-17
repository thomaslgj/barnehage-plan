import React from 'react';
import { View } from 'react-native';
import Skeleton from './Skeleton';
import tw from '../lib/tw';

export default function TodayCardSkeleton() {
  return (
    <View style={tw`bg-slate-800/50 rounded-xl p-5 mb-6 border border-slate-700/50`}>
      {/* Title and date */}
      <View style={tw`mb-4`}>
        <Skeleton width={120} height={28} />
        <View style={tw`mt-1`}>
          <Skeleton width={80} height={16} />
        </View>
      </View>

      {/* Avatar slots */}
      <View style={tw`flex-row gap-4 mb-4`}>
        {/* Left slot */}
        <View style={tw`flex-1 flex-row items-center justify-end gap-2`}>
          <Skeleton width={56} height={56} borderRadius={28} />
        </View>
        {/* Right slot */}
        <View style={tw`flex-1 flex-row items-center justify-start gap-2`}>
          <Skeleton width={56} height={56} borderRadius={28} />
        </View>
      </View>

      {/* Equipment badge */}
      <Skeleton width="100%" height={48} borderRadius={24} />
    </View>
  );
}
