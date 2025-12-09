import React from 'react';
import { View, Text } from 'react-native';
import { CreditCardIcon } from 'react-native-heroicons/outline';
import type { CardScheme } from '../../utils/cardValidation';

interface CardSchemeIconProps {
  scheme: CardScheme;
  size?: number;
}

/*
  Renders an icon representing the card scheme (e.g., Visa, MasterCard).
  If the scheme is unknown, a generic credit card icon is displayed.

  Avoiding use of image assets for simplicity and copyright reasons.
*/
export function CardSchemeIcon({ scheme, size = 32 }: CardSchemeIconProps) {
  const getSchemeColor = () => {
    switch (scheme) {
      case 'visa':
        return '#1A1F71';
      case 'mastercard':
        return '#EB001B';
      case 'amex':
        return '#006FCF';
      case 'discover':
        return '#FF6000';
      case 'diners':
        return '#0079BE';
      default:
        return '#6B7280';
    }
  };

  const getSchemeName = () => {
    switch (scheme) {
      case 'visa':
        return 'VISA';
      case 'mastercard':
        return 'MC';
      case 'amex':
        return 'AMEX';
      case 'discover':
        return 'DISC';
      case 'diners':
        return 'DINERS';
      default:
        return '';
    }
  };

  if (scheme === 'unknown') {
    return <CreditCardIcon size={size} color="#9CA3AF" />;
  }

  return (
    <View
      style={{
        width: size * 1.5,
        height: size,
        borderRadius: 4,
        backgroundColor: getSchemeColor(),
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text
        style={{
          color: 'white',
          fontSize: size * 0.35,
          fontWeight: 'bold',
        }}>
        {getSchemeName()}
      </Text>
    </View>
  );
}
