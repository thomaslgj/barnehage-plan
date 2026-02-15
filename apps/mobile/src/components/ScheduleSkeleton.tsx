import React from 'react';
import { View } from 'react-native';
import Skeleton from './Skeleton';
import tw from '../lib/tw';

export default function ScheduleSkeleton() {
  const daysOfWeek = ['Man', 'Tir', 'Ons', 'Tor', 'Fre'];

  return (
    <View style={tw`gap-2`}>
      {/* Header */}
      <View style={tw`flex-row gap-2 mb-2 px-1`}>
        <View style={tw`flex-1 items-center`}>
          <Skeleton width={60} height={12} />
        </View>
        <View style={tw`flex-1 items-center`}>
          <Skeleton width={60} height={12} />
        </View>
      </View>

      {/* Day rows */}
      {daysOfWeek.map((day, index) => (
        <View key={index} style={tw`flex-row gap-2`}>
          {/* Delivery slot */}
          <View style={tw`flex-1`}>
            <Skeleton height={72} borderRadius={12} />
          </View>

          {/* Pickup slot */}
          <View style={tw`flex-1`}>
            <Skeleton height={72} borderRadius={12} />
          </View>
        </View>
      ))}
    </View>
  );
}
