import React from 'react';
import { View, Text } from 'react-native';
import tw from './src/lib/tw';

export default function TestTwrnc() {
  return (
    <View style={tw`flex-1 bg-red-500 justify-center items-center`}>
      <Text style={tw`text-white text-2xl font-bold`}>
        twrnc Test
      </Text>
      <Text style={tw`text-white mt-4`}>
        If you see RED background and WHITE text, twrnc works!
      </Text>
    </View>
  );
}
