import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import tw from '../lib/tw';

export default function SplashScreen() {
  const letterF = useRef(new Animated.Value(0)).current;
  const letterL = useRef(new Animated.Value(0)).current;
  const letterY = useRef(new Animated.Value(0)).current;
  const letterT = useRef(new Animated.Value(0)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Stagger animation for each letter, then tagline
    Animated.stagger(150, [
      Animated.timing(letterF, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(letterL, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(letterY, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(letterT, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(taglineFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const letterStyle = [tw`text-5xl text-center`, { fontFamily: 'Manrope_500Medium', color: '#d4c5b9' }];

  return (
    <View style={tw`flex-1 bg-background justify-center items-center px-8`}>
      {/* Main logo text - animated letter by letter */}
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <Animated.Text style={[letterStyle, { opacity: letterF, transform: [{ translateY: letterF.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          F
        </Animated.Text>
        <Animated.Text style={[letterStyle, { opacity: letterL, transform: [{ translateY: letterL.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }], marginLeft: 12 }]}>
          L
        </Animated.Text>
        <Animated.Text style={[letterStyle, { opacity: letterY, transform: [{ translateY: letterY.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }], marginLeft: 12 }]}>
          Y
        </Animated.Text>
        <Animated.Text style={[letterStyle, { opacity: letterT, transform: [{ translateY: letterT.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }], marginLeft: 12 }]}>
          T
        </Animated.Text>
      </View>

      {/* Tagline */}
      <Animated.View style={{ opacity: taglineFade, transform: [{ translateY: taglineFade.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        <Text style={[tw`text-lg text-text-muted text-center tracking-wide`, { fontFamily: 'Manrope_400Regular' }]}>
          Flyt i hverdagen
        </Text>
      </Animated.View>
    </View>
  );
}
