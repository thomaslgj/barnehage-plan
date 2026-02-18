import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import tw from '../lib/tw';

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'small';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
}

const variantStyles: Record<TextVariant, TextStyle> = {
  h1: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
  },
  h2: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  h3: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  small: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
};

export function Text({
  variant = 'body',
  color,
  style,
  ...props
}: TextProps) {
  const variantStyle = variantStyles[variant];
  const colorStyle = color ? { color } : undefined;

  return (
    <RNText
      style={[variantStyle, colorStyle, style]}
      {...props}
    />
  );
}

// Convenience components for common use cases
export function H1(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h1" {...props} />;
}

export function H2(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h2" {...props} />;
}

export function H3(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h3" {...props} />;
}

export function Caption(props: Omit<TextProps, 'variant'>) {
  return <Text variant="caption" {...props} />;
}

export function Small(props: Omit<TextProps, 'variant'>) {
  return <Text variant="small" {...props} />;
}
