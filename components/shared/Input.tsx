import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  hideLabel?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Input({
  label,
  error,
  containerClassName = '',
  hideLabel = false,
  accessibilityLabel,
  accessibilityHint,
  ...textInputProps
}: InputProps) {
  return (
    <View className={containerClassName}>
      {!hideLabel && label && (
        <Text className="mb-2 text-sm font-medium text-gray-700">{label}</Text>
      )}
      <TextInput
        className={`rounded-lg border bg-white px-4 py-3 text-base ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        accessible={true}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: textInputProps.editable === false }}
        importantForAccessibility="yes"
        {...textInputProps}
      />
      {error && (
        <Text className="mt-1 text-xs text-red-600" accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
}
