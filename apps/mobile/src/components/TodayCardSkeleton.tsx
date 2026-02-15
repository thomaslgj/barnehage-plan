import React from 'react';
import { View } from 'react-native';
import Skeleton from './Skeleton';
import tw from '../lib/tw';

export default function TodayCardSkeleton() {
  return (
    <View style={tw`bg-card p-6 rounded-3xl mb-6`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <Skeleton width={120} height={24} />
        <Skeleton width={80} height={20} />
      </View>

      {/* Main content */}
      <View style={tw`gap-3`}>
        {/* Delivery slot */}
        <View style={tw`flex-row items-center gap-3`}>
          <Skeleton width={60} height={60} borderRadius={12} />
          <View style={tw`flex-1 gap-2`}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="80%" height={20} />
          </View>
        </View>

        {/* Pickup slot */}
        <View style={tw`flex-row items-center gap-3`}>
          <Skeleton width={60} height={60} borderRadius={12} />
          <View style={tw`flex-1 gap-2`}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="80%" height={20} />
          </View>
        </View>
      </View>
    </View>
  );
}
