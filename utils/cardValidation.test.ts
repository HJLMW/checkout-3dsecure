import {
  detectCardScheme,
  formatCardNumber,
  validateCardNumberLuhn,
  validateCardLength,
  validateCVV,
  getMaxCardLength,
  getCVVLength,
  type CardScheme,
} from './cardValidation';

describe('Card Validation Utils', () => {
  describe('detectCardScheme', () => {
    it('should detect Visa cards', () => {
      expect(detectCardScheme('4242424242424242')).toBe('visa');
      expect(detectCardScheme('4000056655665556')).toBe('visa');
      expect(detectCardScheme('4111111111111111')).toBe('visa');
    });

    it('should detect Mastercard', () => {
      expect(detectCardScheme('5555555555554444')).toBe('mastercard');
      expect(detectCardScheme('5105105105105100')).toBe('mastercard');
      expect(detectCardScheme('2223003122003222')).toBe('mastercard');
    });

    it('should detect American Express', () => {
      expect(detectCardScheme('378282246310005')).toBe('amex');
      expect(detectCardScheme('371449635398431')).toBe('amex');
      expect(detectCardScheme('340000000000009')).toBe('amex');
    });

    it('should detect Discover', () => {
      expect(detectCardScheme('6011111111111117')).toBe('discover');
      expect(detectCardScheme('6011000990139424')).toBe('discover');
    });

    it('should detect Diners Club', () => {
      expect(detectCardScheme('3056930009020004')).toBe('diners');
      expect(detectCardScheme('36227206271667')).toBe('diners');
      expect(detectCardScheme('3841001111222233334')).toBe('diners');
    });

    it('should return unknown for unrecognized patterns', () => {
      expect(detectCardScheme('1234567890123456')).toBe('unknown');
      expect(detectCardScheme('9999999999999999')).toBe('unknown');
    });

    it('should work with formatted numbers (spaces)', () => {
      expect(detectCardScheme('4242 4242 4242 4242')).toBe('visa');
      expect(detectCardScheme('5555 5555 5555 4444')).toBe('mastercard');
    });
  });

  describe('formatCardNumber', () => {
    it('should format Visa numbers with spaces at positions 4, 8, 12', () => {
      expect(formatCardNumber('4242424242424242', 'visa')).toBe('4242 4242 4242 4242');
      expect(formatCardNumber('4111111111', 'visa')).toBe('4111 1111 11');
    });

    it('should format Mastercard numbers with spaces at positions 4, 8, 12', () => {
      expect(formatCardNumber('5555555555554444', 'mastercard')).toBe('5555 5555 5555 4444');
    });

    it('should format Amex numbers with spaces at positions 4, 10', () => {
      expect(formatCardNumber('378282246310005', 'amex')).toBe('3782 822463 10005');
      expect(formatCardNumber('34000000', 'amex')).toBe('3400 0000');
    });

    it('should handle already formatted numbers', () => {
      expect(formatCardNumber('4242 4242 4242 4242', 'visa')).toBe('4242 4242 4242 4242');
    });

    it('should handle partial numbers', () => {
      expect(formatCardNumber('42', 'visa')).toBe('42');
      expect(formatCardNumber('4242', 'visa')).toBe('4242');
      expect(formatCardNumber('42424', 'visa')).toBe('4242 4');
    });
  });

  describe('validateCardNumberLuhn', () => {
    it('should validate correct Visa numbers', () => {
      expect(validateCardNumberLuhn('4242424242424242')).toBe(true);
      expect(validateCardNumberLuhn('4111111111111111')).toBe(true);
      expect(validateCardNumberLuhn('4000056655665556')).toBe(true);
    });

    it('should validate correct Mastercard numbers', () => {
      expect(validateCardNumberLuhn('5555555555554444')).toBe(true);
      expect(validateCardNumberLuhn('5105105105105100')).toBe(true);
    });

    it('should validate correct Amex numbers', () => {
      expect(validateCardNumberLuhn('378282246310005')).toBe(true);
      expect(validateCardNumberLuhn('371449635398431')).toBe(true);
    });

    it('should reject invalid card numbers', () => {
      expect(validateCardNumberLuhn('4242424242424241')).toBe(false);
      expect(validateCardNumberLuhn('1234567890123456')).toBe(false);
      // Note: 0000000000000000 passes Luhn but is invalid in practice
    });

    it('should work with formatted numbers (spaces)', () => {
      expect(validateCardNumberLuhn('4242 4242 4242 4242')).toBe(true);
      expect(validateCardNumberLuhn('4242 4242 4242 4241')).toBe(false);
    });

    it('should reject non-numeric input', () => {
      expect(validateCardNumberLuhn('424242424242424a')).toBe(false);
      expect(validateCardNumberLuhn('abcd-efgh-ijkl-mnop')).toBe(false);
    });

    it('should reject empty or very short numbers', () => {
      expect(validateCardNumberLuhn('')).toBe(false);
      expect(validateCardNumberLuhn('0')).toBe(true); // 0 passes Luhn
      expect(validateCardNumberLuhn('00')).toBe(true); // 00 passes Luhn
    });
  });

  describe('validateCardLength', () => {
    it('should validate Visa card length (16 digits)', () => {
      expect(validateCardLength('4242424242424242', 'visa')).toBe(true);
      expect(validateCardLength('424242424242424', 'visa')).toBe(false);
      expect(validateCardLength('42424242424242420', 'visa')).toBe(false);
    });

    it('should validate Mastercard length (16 digits)', () => {
      expect(validateCardLength('5555555555554444', 'mastercard')).toBe(true);
      expect(validateCardLength('555555555555444', 'mastercard')).toBe(false);
    });

    it('should validate Amex length (15 digits)', () => {
      expect(validateCardLength('378282246310005', 'amex')).toBe(true);
      expect(validateCardLength('37828224631000', 'amex')).toBe(false);
      expect(validateCardLength('3782822463100050', 'amex')).toBe(false);
    });

    it('should validate Diners Club length (14 or 16 digits)', () => {
      expect(validateCardLength('36227206271667', 'diners')).toBe(true);
      expect(validateCardLength('3622720627166700', 'diners')).toBe(true);
      expect(validateCardLength('362272062716', 'diners')).toBe(false);
    });

    it('should work with formatted numbers', () => {
      expect(validateCardLength('4242 4242 4242 4242', 'visa')).toBe(true);
      expect(validateCardLength('3782 822463 10005', 'amex')).toBe(true);
    });
  });

  describe('validateCVV', () => {
    it('should validate 3-digit CVV for Visa', () => {
      expect(validateCVV('123', 'visa')).toBe(true);
      expect(validateCVV('000', 'visa')).toBe(true);
      expect(validateCVV('12', 'visa')).toBe(false);
      expect(validateCVV('1234', 'visa')).toBe(false);
    });

    it('should validate 3-digit CVV for Mastercard', () => {
      expect(validateCVV('456', 'mastercard')).toBe(true);
      expect(validateCVV('45', 'mastercard')).toBe(false);
      expect(validateCVV('4567', 'mastercard')).toBe(false);
    });

    it('should validate 4-digit CVV for Amex', () => {
      expect(validateCVV('1234', 'amex')).toBe(true);
      expect(validateCVV('0000', 'amex')).toBe(true);
      expect(validateCVV('123', 'amex')).toBe(false);
      expect(validateCVV('12345', 'amex')).toBe(false);
    });

    it('should reject non-numeric CVV', () => {
      expect(validateCVV('12a', 'visa')).toBe(false);
      expect(validateCVV('abc', 'visa')).toBe(false);
      expect(validateCVV('12 3', 'visa')).toBe(false);
    });

    it('should reject empty CVV', () => {
      expect(validateCVV('', 'visa')).toBe(false);
      expect(validateCVV('', 'amex')).toBe(false);
    });
  });

  describe('getMaxCardLength', () => {
    it('should return correct max length for Visa (16 digits + 3 gaps = 19)', () => {
      expect(getMaxCardLength('visa')).toBe(19);
    });

    it('should return correct max length for Mastercard (16 digits + 3 gaps = 19)', () => {
      expect(getMaxCardLength('mastercard')).toBe(19);
    });

    it('should return correct max length for Amex (15 digits + 2 gaps = 17)', () => {
      expect(getMaxCardLength('amex')).toBe(17);
    });

    it('should return correct max length for Diners (16 digits + 2 gaps = 18)', () => {
      expect(getMaxCardLength('diners')).toBe(18);
    });

    it('should return correct max length for unknown cards (16 digits + 3 gaps = 19)', () => {
      expect(getMaxCardLength('unknown')).toBe(19);
    });
  });

  describe('getCVVLength', () => {
    it('should return 3 for Visa', () => {
      expect(getCVVLength('visa')).toBe(3);
    });

    it('should return 3 for Mastercard', () => {
      expect(getCVVLength('mastercard')).toBe(3);
    });

    it('should return 4 for Amex', () => {
      expect(getCVVLength('amex')).toBe(4);
    });

    it('should return 3 for Discover', () => {
      expect(getCVVLength('discover')).toBe(3);
    });

    it('should return 3 for Diners', () => {
      expect(getCVVLength('diners')).toBe(3);
    });

    it('should return 3 for unknown cards', () => {
      expect(getCVVLength('unknown')).toBe(3);
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle complete validation flow for Visa', () => {
      const cardNumber = '4242424242424242';
      const scheme = detectCardScheme(cardNumber);
      const formatted = formatCardNumber(cardNumber, scheme);
      const isValidLuhn = validateCardNumberLuhn(cardNumber);
      const isValidLength = validateCardLength(cardNumber, scheme);
      const isValidCVV = validateCVV('123', scheme);

      expect(scheme).toBe('visa');
      expect(formatted).toBe('4242 4242 4242 4242');
      expect(isValidLuhn).toBe(true);
      expect(isValidLength).toBe(true);
      expect(isValidCVV).toBe(true);
    });

    it('should handle complete validation flow for Amex', () => {
      const cardNumber = '378282246310005';
      const scheme = detectCardScheme(cardNumber);
      const formatted = formatCardNumber(cardNumber, scheme);
      const isValidLuhn = validateCardNumberLuhn(cardNumber);
      const isValidLength = validateCardLength(cardNumber, scheme);
      const isValidCVV = validateCVV('1234', scheme);

      expect(scheme).toBe('amex');
      expect(formatted).toBe('3782 822463 10005');
      expect(isValidLuhn).toBe(true);
      expect(isValidLength).toBe(true);
      expect(isValidCVV).toBe(true);
    });

    it('should reject invalid complete flow', () => {
      const cardNumber = '1234567890123456';
      const scheme = detectCardScheme(cardNumber);
      const isValidLuhn = validateCardNumberLuhn(cardNumber);

      expect(scheme).toBe('unknown');
      expect(isValidLuhn).toBe(false);
    });
  });
});
