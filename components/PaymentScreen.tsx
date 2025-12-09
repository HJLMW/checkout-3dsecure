import React, { useEffect } from 'react';
import { Text, View, ScrollView, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { CardForm } from './CardForm';
import { ThreeDSWebView } from './ThreeDSWebView';
import { PaymentSuccessScreen } from './PaymentSuccessScreen';
import { PaymentFailureScreen } from './PaymentFailureScreen';
import { usePayment } from '../hooks/usePayment';
import { CardData } from 'api/services/payments/types';
import CheckoutLogo from '../assets/checkout-logo.svg';

export function PaymentScreen() {
  const {
    loading,
    error,
    success,
    failed,
    show3DS,
    redirectUrl,
    submitPayment,
    handle3DSSuccess,
    handle3DSFailure,
    close3DS,
    reset,
  } = usePayment();

  const handlePayment = async (cardData: CardData) => {
    // Amount in pence (e.g., £10.00 = 1000)
    await submitPayment(cardData, 1000, 'GBP');
  };

  // Handle deep links for 3DS authentication redirects
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      if (event.url.startsWith('checkoutcc://payment/success')) {
        console.log('3DS Success via deep link');
        handle3DSSuccess();
      } else if (event.url.startsWith('checkoutcc://payment/failure')) {
        console.log('3DS Failure via deep link');
        handle3DSFailure();
      }
    };

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was launched via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [handle3DSSuccess, handle3DSFailure]);

  // Show success screen
  if (success) {
    return <PaymentSuccessScreen onNewPayment={reset} />;
  }

  // Show error screen
  if (failed) {
    return <PaymentFailureScreen onRetry={reset} />;
  }

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView className="flex-1" contentContainerClassName="py-8">
          {/* Header */}
          <View className="mb-8 items-center px-6 pt-8">
            <CheckoutLogo width={180} height={40} />
            <Text className="text-sm text-gray-600">Secure Payment Processing</Text>
            <View className="mt-4 rounded-lg bg-blue-50 p-3">
              <Text className="text-xs font-medium text-blue-800">Amount: £10.00 GBP</Text>
            </View>
          </View>

          {/* Card Form */}
          <CardForm onSubmit={handlePayment} loading={loading} error={error} success={success} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 3DS WebView Modal */}
      <ThreeDSWebView
        visible={show3DS}
        redirectUrl={redirectUrl}
        onSuccess={handle3DSSuccess}
        onFailure={handle3DSFailure}
        onClose={close3DS}
      />
    </>
  );
}
