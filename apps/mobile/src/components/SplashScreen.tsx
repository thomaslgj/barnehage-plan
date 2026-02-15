import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import tw from '../lib/tw';

const { width, height } = Dimensions.get('window');
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function SplashScreen() {
  const letterF = useRef(new Animated.Value(0)).current;
  const letterL = useRef(new Animated.Value(0)).current;
  const letterY = useRef(new Animated.Value(0)).current;
  const letterT = useRef(new Animated.Value(0)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;
  const gradientShift = useRef(new Animated.Value(0)).current;

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

    // Soft organic blob drift - 14 second loop (7s each way)
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientShift, {
          toValue: 1,
          duration: 7000,
          useNativeDriver: true,
          easing: (t) => {
            // ease-in-out
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          },
        }),
        Animated.timing(gradientShift, {
          toValue: 0,
          duration: 7000,
          useNativeDriver: true,
          easing: (t) => {
            // ease-in-out
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          },
        }),
      ])
    ).start();
  }, []);

  const letterStyle = [tw`text-5xl text-center`, { fontFamily: 'Manrope_500Medium', color: '#EDE7DF' }];

  // Blob size: double size for more visible presence
  const blobSize = width * 2.2; // Doubled from 1.1
  const svgSize = blobSize * 1.5;

  // Calculate positions so blob CENTER is where we want it
  // Blob center is at svgSize/2 from SVG's left edge
  const blobRadius = svgSize / 2;

  // Start: blob center at 70% of screen width (right side)
  const startX = width * 0.7 - blobRadius;

  // End: blob center at 30% of screen width (left side)
  const endX = width * 0.3 - blobRadius;

  // Vertical center
  const centerY = (height - svgSize) / 2;

  // Horizontal animation: right to left
  const blobX = gradientShift.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, endX],
  });

  const blobY = gradientShift.interpolate({
    inputRange: [0, 1],
    outputRange: [centerY, centerY], // Stay vertically centered
  });

  return (
    <View style={[styles.container, { backgroundColor: '#1B1714' }]}>
      {/* Blurred organic blob using SVG RadialGradient */}
      <AnimatedSvg
        width={blobSize * 1.5}
        height={blobSize * 1.5}
        style={{
          position: 'absolute',
          transform: [
            { translateX: blobX },
            { translateY: blobY },
          ],
        }}
      >
        <Defs>
          <RadialGradient id="blobGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#5A4A3D" stopOpacity="1" />
            <Stop offset="10%" stopColor="#4A3A2D" stopOpacity="0.85" />
            <Stop offset="25%" stopColor="#3A2D23" stopOpacity="0.7" />
            <Stop offset="40%" stopColor="#2F2822" stopOpacity="0.55" />
            <Stop offset="60%" stopColor="#26201C" stopOpacity="0.35" />
            <Stop offset="75%" stopColor="#201D19" stopOpacity="0.18" />
            <Stop offset="90%" stopColor="#1D1A17" stopOpacity="0.06" />
            <Stop offset="100%" stopColor="#1B1714" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle
          cx={(blobSize * 1.5) / 2}
          cy={(blobSize * 1.5) / 2}
          r={(blobSize * 1.5) / 2}
          fill="url(#blobGradient)"
        />
      </AnimatedSvg>

      <View style={tw`flex-1 justify-center items-center px-8`}>
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
        <Text style={[tw`text-lg text-center tracking-wide`, { fontFamily: 'Manrope_400Regular', color: '#a89985' }]}>
          Gjør hverdagen enklere
        </Text>
      </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
