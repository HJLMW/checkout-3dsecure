import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import type { CardData } from '../api/services/payments/types';
import { Input } from './shared/Input';
import { CardSchemeIcon } from './shared/CardSchemeIcon';
import {
  detectCardScheme,
  formatCardNumber,
  validateCardNumberLuhn,
  validateCardLength,
  validateCVV,
  getMaxCardLength,
  getCVVLength,
  type CardScheme,
} from '../utils/cardValidation';

interface CardFormProps {
  onSubmit: (card: CardData) => void;
  loading?: boolean;
  error?: string | null;
  success?: boolean;
}

interface ValidationErrors {
  cardNumber?: string;
  cardName?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
}

interface FormData {
  cardNumber: string;
  cardName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export function CardForm({ onSubmit, loading, error, success }: CardFormProps) {
  const [formData, setFormData] = useState<FormData>({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Automatically detect card type
  const cardScheme: CardScheme = useMemo(() => {
    return detectCardScheme(formData.cardNumber);
  }, [formData.cardNumber]);

  // Get lengths based on card type (already include spaces)
  const maxCardLength = useMemo(() => getMaxCardLength(cardScheme), [cardScheme]);
  const cvvLength = useMemo(() => getCVVLength(cardScheme), [cardScheme]);

  const handleChange = (name: keyof FormData, text: string) => {
    let value = text;

    // Validation and formatting based on field
    switch (name) {
      case 'cardNumber':
        const cleaned = text.replace(/\s/g, '');
        const currentScheme = detectCardScheme(cleaned);
        const maxLength = getMaxCardLength(currentScheme);

        // Limit length and only numbers
        if (cleaned.length > maxLength || !/^\d*$/.test(cleaned)) return;

        // Format with spaces based on card type
        value = formatCardNumber(cleaned, currentScheme);
        break;
      case 'expiryMonth':
        if (text.length > 2 || !/^\d*$/.test(text)) return;
        break;
      case 'expiryYear':
        if (text.length > 4 || !/^\d*$/.test(text)) return;
        break;
      case 'cvv':
        // Dynamic CVV based on card type
        const currentCvvLength = getCVVLength(cardScheme);
        if (text.length > currentCvvLength || !/^\d*$/.test(text)) return;
        break;
    }

    // Update value
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = () => {
    const errors: ValidationErrors = {};
    const currentYear = new Date().getFullYear();
    const cleanCardNumber = formData.cardNumber.replace(/\s/g, '');

    // Card type specific validations
    if (!validateCardLength(cleanCardNumber, cardScheme)) {
      errors.cardNumber = `Invalid ${cardScheme === 'unknown' ? 'card' : cardScheme} number length`;
    } else if (!validateCardNumberLuhn(cleanCardNumber)) {
      errors.cardNumber = 'Invalid card number';
    }

    if (!formData.cardName.trim()) {
      errors.cardName = 'Cardholder name is required';
    }
    if (
      !formData.expiryMonth ||
      parseInt(formData.expiryMonth) < 1 ||
      parseInt(formData.expiryMonth) > 12
    ) {
      errors.expiryMonth = 'Month must be 01-12';
    }
    if (!formData.expiryYear || formData.expiryYear.length !== 4) {
      errors.expiryYear = 'Year must be 4 digits';
    } else if (parseInt(formData.expiryYear) < currentYear) {
      errors.expiryYear = 'Card has expired';
    }
    if (!validateCVV(formData.cvv, cardScheme)) {
      errors.cvv = `CVV must be ${cvvLength} digits${cardScheme === 'amex' ? ' (front of card)' : ''}`;
    }

    setValidationErrors(errors);

    // If there are errors, don't continue
    if (Object.keys(errors).length > 0) {
      return;
    }

    onSubmit({
      number: cleanCardNumber,
      name: formData.cardName,
      expiryMonth: formData.expiryMonth,
      expiryYear: formData.expiryYear,
      cvv: formData.cvv,
    });
  };

  return (
    <View className="w-full px-6">
      {/* Card Number with scheme icon */}
      <View className="mb-4">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm font-medium text-gray-700">Card Number</Text>
          <CardSchemeIcon scheme={cardScheme} size={24} />
        </View>
        <Input
          placeholder="1234 5678 9012 3456"
          keyboardType="numeric"
          value={formData.cardNumber}
          onChangeText={(text) => handleChange('cardNumber', text)}
          maxLength={maxCardLength}
          editable={!loading}
          error={validationErrors.cardNumber}
          hideLabel
          accessibilityLabel="Card number"
          accessibilityHint={`Enter your ${cardScheme === 'unknown' ? '' : cardScheme + ' '}card number`}
        />
      </View>

      {/* Cardholder Name */}
      <Input
        label="Cardholder Name"
        placeholder="John Doe"
        value={formData.cardName}
        onChangeText={(text) => handleChange('cardName', text)}
        autoCapitalize="words"
        editable={!loading}
        error={validationErrors.cardName}
        containerClassName="mb-4"
        accessibilityHint="Enter the name as it appears on the card"
      />

      {/* Expiry and CVV */}
      <View className="mb-4 flex-row gap-4">
        <Input
          label="Expiry Month"
          placeholder="MM"
          keyboardType="numeric"
          value={formData.expiryMonth}
          onChangeText={(text) => handleChange('expiryMonth', text)}
          maxLength={2}
          editable={!loading}
          error={validationErrors.expiryMonth}
          containerClassName="flex-1"
          accessibilityHint="Enter expiration month, two digits"
        />

        <Input
          label="Expiry Year"
          placeholder="YYYY"
          keyboardType="numeric"
          value={formData.expiryYear}
          onChangeText={(text) => handleChange('expiryYear', text)}
          maxLength={4}
          editable={!loading}
          error={validationErrors.expiryYear}
          containerClassName="flex-1"
          accessibilityHint="Enter expiration year, four digits"
        />

        <Input
          label="CVV"
          placeholder={cardScheme === 'amex' ? '1234' : '123'}
          keyboardType="numeric"
          value={formData.cvv}
          onChangeText={(text) => handleChange('cvv', text)}
          maxLength={cvvLength}
          secureTextEntry
          editable={!loading}
          error={validationErrors.cvv}
          containerClassName="flex-1"
          accessibilityLabel="Card security code"
          accessibilityHint={`Enter ${cvvLength} digit security code${cardScheme === 'amex' ? ' from the front of your card' : ''}`}
        />
      </View>

      {/* Error Message */}
      {error && (
        <View className="mb-4 rounded-lg bg-red-50 p-3" accessibilityRole="alert">
          <Text className="text-sm text-red-600">{error}</Text>
        </View>
      )}

      {/* Success Message */}
      {success && (
        <View className="mb-4 rounded-lg bg-green-50 p-3" accessibilityRole="alert">
          <Text className="text-sm text-green-600">Payment successful! ✓</Text>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        className={`rounded-lg py-4 ${loading ? 'bg-gray-400' : 'bg-blue-600'}`}
        onPress={handleSubmit}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Pay now"
        accessibilityHint="Submit payment for processing"
        accessibilityState={{ disabled: loading }}>
        {loading ? (
          <ActivityIndicator color="white" accessibilityLabel="Processing payment" />
        ) : (
          <Text className="text-center text-base font-semibold text-white">Pay Now</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
