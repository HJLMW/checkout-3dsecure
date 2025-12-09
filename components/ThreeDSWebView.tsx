import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  BackHandler,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';

interface ThreeDSWebViewProps {
  visible: boolean;
  redirectUrl: string;
  onSuccess: () => void;
  onFailure: () => void;
  onClose: () => void;
}

export function ThreeDSWebView({
  visible,
  redirectUrl,
  onSuccess,
  onFailure,
  onClose,
}: ThreeDSWebViewProps) {
  const [loading, setLoading] = React.useState(true);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        Alert.alert(
          'Cancel Payment',
          'Are you sure you want to cancel the authentication? Your payment will not be processed.',
          [
            {
              text: 'Continue',
              style: 'cancel',
            },
            {
              text: 'Cancel Payment',
              style: 'destructive',
              onPress: () => {
                onFailure();
              },
            },
          ]
        );
        return true; // Prevent default back behavior
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible, onFailure]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="border-b border-gray-200 bg-white px-4 pb-4 pt-12">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-gray-900">3D Secure Verification</Text>
            <TouchableOpacity onPress={onClose} className="rounded-lg bg-gray-100 px-4 py-2">
              <Text className="text-sm font-medium text-gray-700">Cancel</Text>
            </TouchableOpacity>
          </View>
          <Text className="mt-2 text-sm text-gray-600">
            Complete the verification to process your payment
          </Text>
        </View>

        {/* WebView */}
        <View className="flex-1">
          {loading && (
            <View className="absolute inset-0 z-10 items-center justify-center bg-white">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="mt-4 text-sm text-gray-600">Loading verification...</Text>
            </View>
          )}

          <WebView
            source={{ uri: redirectUrl }}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </Modal>
  );
}
