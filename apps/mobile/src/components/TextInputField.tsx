import React from 'react';
import { View, TextInput as RNTextInput, TextInputProps as RNTextInputProps } from 'react-native';
import tw from '../lib/tw';
import { Text } from './Text';

interface TextInputFieldProps extends RNTextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

export function TextInputField({
  label,
  error,
  helperText,
  style,
  editable = true,
  ...props
}: TextInputFieldProps) {
  const hasError = !!error;
  const isDisabled = !editable;

  const inputStyle = [
    tw`bg-slate-800/50 border rounded px-4 py-3 text-base text-white`,
    hasError ? tw`border-error` : tw`border-slate-700`,
    isDisabled ? tw`opacity-50` : undefined,
    style,
  ];

  return (
    <View style={tw`mb-4`}>
      {label && (
        <Text style={tw`text-sm text-text-light mb-2`}>
          {label}
        </Text>
      )}

      <RNTextInput
        style={[inputStyle, { fontFamily: 'Manrope_400Regular' }]}
        placeholderTextColor="#a89985"
        editable={editable}
        {...props}
      />

      {error && (
        <Text style={tw`text-sm text-error mt-1`}>
          {error}
        </Text>
      )}

      {helperText && !error && (
        <Text style={tw`text-sm text-text-muted mt-1`}>
          {helperText}
        </Text>
      )}
    </View>
  );
}
