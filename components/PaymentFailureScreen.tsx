import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { XCircleIcon } from 'react-native-heroicons/solid';
import CheckoutLogo from '../assets/checkout-logo.svg';

interface PaymentFailureScreenProps {
  onRetry: () => void;
}

export function PaymentFailureScreen({ onRetry }: PaymentFailureScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      {/* Logo */}
      <View className="mb-8">
        <CheckoutLogo width={160} height={36} />
      </View>

      {/* Error Icon */}
      <View className="mb-6">
        <XCircleIcon size={80} color="#EF4444" />
      </View>

      {/* Error Message */}
      <Text className="mb-2 text-2xl font-bold text-gray-900">Payment Failed</Text>
      <Text className="mb-8 text-center text-base text-gray-600">
        We couldn't process your payment. Please try again.
      </Text>

      {/* Details Card */}
      <View className="mb-8 w-full rounded-lg border border-red-200 bg-red-50 p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">Status</Text>
          <Text className="font-semibold text-red-700">Failed</Text>
        </View>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">Amount</Text>
          <Text className="font-semibold text-gray-900">£10.00 GBP</Text>
        </View>
      </View>

      {/* Retry Button */}
      <TouchableOpacity
        onPress={onRetry}
        className="w-full rounded-lg bg-blue-600 px-6 py-4"
        activeOpacity={0.8}>
        <Text className="text-center text-base font-semibold text-white">Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}
