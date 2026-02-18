import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, Platform, StatusBar, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from './Avatar';

interface AvatarTransitionProps {
  leftAvatarId?: string | null;
  rightAvatarId?: string | null;
  leftBorderColor?: string;
  rightBorderColor?: string;
  leftName?: string;
  rightName?: string;
  onComplete?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AvatarTransition({
  leftAvatarId,
  rightAvatarId,
  leftBorderColor = '#6b8e6f',
  rightBorderColor = '#e8c96f',
  leftName,
  rightName,
  onComplete,
}: AvatarTransitionProps) {
  const insets = useSafeAreaInsets();

  // Animation values
  const leftAvatarX = useRef(new Animated.Value(0)).current;
  const leftAvatarOpacity = useRef(new Animated.Value(0)).current;
  const leftTextOpacity = useRef(new Animated.Value(0)).current;
  const rightAvatarX = useRef(new Animated.Value(0)).current;
  const rightAvatarOpacity = useRef(new Animated.Value(0)).current;
  const rightTextOpacity = useRef(new Animated.Value(0)).current;
  const lineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Calculate positions for animation
    // Avatars start in center, move to positions that match TodayCard layout
    const moveDistance = 30; // Reduced further to keep avatars closer

    Animated.sequence([
      // 1. Left avatar fades in at center
      Animated.timing(leftAvatarOpacity, {
        toValue: 1,
        duration: 250,
        delay: 200,
        useNativeDriver: true,
      }),
      // 2. Left avatar moves to left
      Animated.timing(leftAvatarX, {
        toValue: -moveDistance,
        duration: 350,
        useNativeDriver: true,
      }),
      // 3. Left text fades in
      Animated.timing(leftTextOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // 4. Right avatar fades in at center
      Animated.timing(rightAvatarOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      // 5. Right avatar moves to right
      Animated.timing(rightAvatarX, {
        toValue: moveDistance,
        duration: 350,
        useNativeDriver: true,
      }),
      // 6. Right text fades in
      Animated.timing(rightTextOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // 7. Connecting line fades in
      Animated.timing(lineOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished && onComplete) {
        onComplete();
      }
    });
  }, []);

  // Calculate position to match TodayCard
  // Account for: SafeArea top + profile header + small margin
  const topPosition = insets.top + 80;

  return (
    <View
      style={{
        position: 'absolute',
        top: topPosition,
        left: 16, // Match ScrollView padding
        right: 16,
        zIndex: 10000,
        pointerEvents: 'none',
      }}
    >
      {/* Transparent container - no background/border */}
      <View style={{ padding: 20 }}>
        {/* Spacer for title/date area */}
        <View style={{ height: 60, marginBottom: 16 }} />

        {/* Avatar container - match TodayCard layout */}
        <View style={{ position: 'relative' }}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {/* Left slot */}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Animated.View
                style={{
                  opacity: leftAvatarOpacity,
                  transform: [{ translateX: leftAvatarX }],
                }}
              >
                <Avatar avatarId={leftAvatarId} size={56} borderColor={leftBorderColor} />
              </Animated.View>
              {leftName && (
                <Animated.Text
                  style={{
                    fontFamily: 'PlusJakartaSans_400Regular',
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: '#f5f1ed',
                    opacity: leftTextOpacity,
                  }}
                  numberOfLines={1}
                >
                  {leftName}
                </Animated.Text>
              )}
            </View>

            {/* Right slot */}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {rightName && (
                <Animated.Text
                  style={{
                    fontFamily: 'PlusJakartaSans_400Regular',
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: '#f5f1ed',
                    opacity: rightTextOpacity,
                  }}
                  numberOfLines={1}
                >
                  {rightName}
                </Animated.Text>
              )}
              <Animated.View
                style={{
                  opacity: rightAvatarOpacity,
                  transform: [{ translateX: rightAvatarX }],
                }}
              >
                <Avatar avatarId={rightAvatarId} size={56} borderColor={rightBorderColor} />
              </Animated.View>
            </View>
          </View>

          {/* Connecting line */}
          <Animated.View
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 96,
              height: 2,
              backgroundColor: '#a89985',
              transform: [{ translateX: -48 }, { translateY: -1 }],
              zIndex: -1,
              opacity: lineOpacity,
            }}
          />
        </View>

        {/* Spacer for equipment badge area */}
        <View style={{ height: 48, marginTop: 16 }} />
      </View>
    </View>
  );
}
