import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, ActivityIndicator, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import tw from '../lib/tw';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles = {
  primary: tw`bg-primary`,
  secondary: tw`bg-secondary`,
  destructive: tw`bg-error`,
  ghost: tw`bg-transparent border-2 border-slate-700`,
};

const sizeStyles = {
  small: tw`px-3 py-2`,
  medium: tw`px-4 py-3`,
  large: tw`px-6 py-4`,
};

const textColorStyles = {
  primary: tw`text-white`,
  secondary: tw`text-slate-900`,
  destructive: tw`text-white`,
  ghost: tw`text-white`,
};

export function Button({
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  disabled = false,
  children,
  leftIcon,
  rightIcon,
  onPress,
  ...props
}: ButtonProps) {
  const handlePress = async (event: any) => {
    if (loading || disabled) return;

    // Haptic feedback
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onPress?.(event);
  };

  const baseStyle = tw`rounded-lg flex-row items-center justify-center gap-2`;
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const widthStyle = fullWidth ? tw`w-full` : undefined;
  const disabledStyle = (disabled || loading) ? tw`opacity-50` : undefined;

  const textColor = textColorStyles[variant];

  return (
    <TouchableOpacity
      style={[baseStyle, variantStyle, sizeStyle, widthStyle, disabledStyle]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' ? '#2d2520' : '#f5f1ed'}
        />
      ) : (
        <>
          {leftIcon}
          <Text style={textColor}>{children}</Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}
