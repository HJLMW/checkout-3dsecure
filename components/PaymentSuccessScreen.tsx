import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircleIcon } from 'react-native-heroicons/solid';
import CheckoutLogo from '../assets/checkout-logo.svg';

interface PaymentSuccessScreenProps {
  onNewPayment: () => void;
}

export function PaymentSuccessScreen({ onNewPayment }: PaymentSuccessScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      {/* Logo */}
      <View className="mb-8">
        <CheckoutLogo width={160} height={36} />
      </View>

      {/* Success Icon */}
      <View className="mb-6">
        <CheckCircleIcon size={80} color="#10B981" />
      </View>

      {/* Success Message */}
      <Text className="mb-2 text-2xl font-bold text-gray-900">Payment Successful!</Text>
      <Text className="mb-8 text-center text-base text-gray-600">
        Your payment has been processed successfully.
      </Text>

      {/* Details Card */}
      <View className="mb-8 w-full rounded-lg border border-green-200 bg-green-50 p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">Status</Text>
          <Text className="font-semibold text-green-700">Completed</Text>
        </View>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">Amount</Text>
          <Text className="font-semibold text-gray-900">£10.00 GBP</Text>
        </View>
      </View>

      {/* New Payment Button */}
      <TouchableOpacity
        onPress={onNewPayment}
        className="w-full rounded-lg bg-blue-600 px-6 py-4"
        activeOpacity={0.8}>
        <Text className="text-center text-base font-semibold text-white">Make Another Payment</Text>
      </TouchableOpacity>
    </View>
  );
}
