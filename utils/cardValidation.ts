export type CardScheme = 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'unknown';

export interface CardSchemeConfig {
  name: string;
  pattern: RegExp;
  length: number[];
  cvvLength: number;
  gaps: number[]; // Positions where spaces go
}

export const CARD_SCHEMES: Record<CardScheme, CardSchemeConfig> = {
  visa: {
    name: 'Visa',
    pattern: /^4/,
    length: [16],
    cvvLength: 3,
    gaps: [4, 8, 12],
  },
  mastercard: {
    name: 'Mastercard',
    pattern: /^(5[1-5]|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)/,
    length: [16],
    cvvLength: 3,
    gaps: [4, 8, 12],
  },
  amex: {
    name: 'American Express',
    pattern: /^3[47]/,
    length: [15],
    cvvLength: 4,
    gaps: [4, 10],
  },
  discover: {
    name: 'Discover',
    pattern: /^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5])|64[4-9]|65)/,
    length: [16],
    cvvLength: 3,
    gaps: [4, 8, 12],
  },
  diners: {
    name: 'Diners Club',
    pattern: /^(36|38|30[0-5])/,
    length: [14, 16],
    cvvLength: 3,
    gaps: [4, 10],
  },
  unknown: {
    name: 'Unknown',
    pattern: /.*/,
    length: [16],
    cvvLength: 3,
    gaps: [4, 8, 12],
  },
};

/**
 * Detects the card type based on the number
 */
export const detectCardScheme = (cardNumber: string): CardScheme => {
  const number = cardNumber.replace(/\s/g, '');

  for (const [scheme, config] of Object.entries(CARD_SCHEMES)) {
    if (scheme === 'unknown') continue;
    if (config.pattern.test(number)) {
      return scheme as CardScheme;
    }
  }

  return 'unknown';
};

/**
 * Formats the card number with spaces based on type
 */
export const formatCardNumber = (value: string, scheme: CardScheme): string => {
  const config = CARD_SCHEMES[scheme];
  const number = value.replace(/\s/g, '');
  const gaps = config.gaps;

  let formatted = '';
  for (let i = 0; i < number.length; i++) {
    if (gaps.includes(i) && i > 0) {
      formatted += ' ';
    }
    formatted += number[i];
  }

  return formatted;
};

/**
 * Validates the card number using the Luhn algorithm
 */
export const validateCardNumberLuhn = (cardNumber: string): boolean => {
  const number = cardNumber.replace(/\s/g, '');

  if (!/^\d+$/.test(number)) return false;

  let sum = 0;
  let isEven = false;

  // Traverse from right to left
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Validates the card number length based on type
 */
export const validateCardLength = (cardNumber: string, scheme: CardScheme): boolean => {
  const number = cardNumber.replace(/\s/g, '');
  const config = CARD_SCHEMES[scheme];
  return config.length.includes(number.length);
};

/**
 * Validates the CVV based on card type
 */
export const validateCVV = (cvv: string, scheme: CardScheme): boolean => {
  const config = CARD_SCHEMES[scheme];
  return cvv.length === config.cvvLength && /^\d+$/.test(cvv);
};

/**
 * Gets the maximum card number length based on type (including spaces)
 */
export const getMaxCardLength = (scheme: CardScheme): number => {
  const config = CARD_SCHEMES[scheme];
  const maxDigits = Math.max(...config.length);
  const numGaps = config.gaps.length;
  return maxDigits + numGaps;
};

/**
 * Gets the CVV length based on card type
 */
export const getCVVLength = (scheme: CardScheme): number => {
  return CARD_SCHEMES[scheme].cvvLength;
};
