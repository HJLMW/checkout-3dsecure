import { renderHook, act } from '@testing-library/react-hooks';
import { usePayment } from './usePayment';
import * as paymentsApi from '../api/services/payments/payments';
import type { PaymentResponse } from '../api/services/payments/types';

// Mock the payments API
jest.mock('../api/services/payments/payments');

describe('usePayment Hook', () => {
  const mockProcessPayment = paymentsApi.processPayment as jest.MockedFunction<
    typeof paymentsApi.processPayment
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => usePayment());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.success).toBe(false);
      expect(result.current.failed).toBe(false);
      expect(result.current.show3DS).toBe(false);
      expect(result.current.redirectUrl).toBe('');
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => usePayment());

      expect(typeof result.current.submitPayment).toBe('function');
      expect(typeof result.current.handle3DSSuccess).toBe('function');
      expect(typeof result.current.handle3DSFailure).toBe('function');
      expect(typeof result.current.close3DS).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('submitPayment', () => {
    const mockCardData = {
      number: '4242424242424242',
      expiryMonth: '12',
      expiryYear: '2025',
      cvv: '123',
      name: 'John Doe',
    };

    it('should handle successful payment without 3DS', async () => {
      const mockResponse: PaymentResponse = {
        id: 'pay_123',
        status: 'Authorized',
        approved: true,
        requiresRedirect: false,
      };

      mockProcessPayment.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => usePayment());

      await act(async () => {
        await result.current.submitPayment(mockCardData, 1000, 'GBP');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.success).toBe(true);
      expect(result.current.failed).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.show3DS).toBe(false);
    });

    it('should handle payment requiring 3DS', async () => {
      const mockResponse: PaymentResponse = {
        id: 'pay_456',
        status: 'Pending',
        approved: false,
        requiresRedirect: true,
        redirectUrl: 'https://3ds.checkout.com/verify',
      };

      mockProcessPayment.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => usePayment());

      await act(async () => {
        await result.current.submitPayment(mockCardData, 1000, 'GBP');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.success).toBe(false);
      expect(result.current.success).toBe(false);
      expect(result.current.show3DS).toBe(true);
      expect(result.current.redirectUrl).toBe('https://3ds.checkout.com/verify');
    });

    it('should handle declined payment', async () => {
      const mockResponse: PaymentResponse = {
        id: 'pay_789',
        status: 'Declined',
        approved: false,
        requiresRedirect: false,
      };

      mockProcessPayment.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => usePayment());

      await act(async () => {
        await result.current.submitPayment(mockCardData, 1000, 'GBP');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.success).toBe(false);
      expect(result.current.failed).toBe(true);
      expect(result.current.error).toBe('Payment was declined');
    });

    it('should handle payment error', async () => {
      const mockResponse: PaymentResponse = {
        id: '',
        status: 'Declined',
        approved: false,
        error: 'Insufficient funds',
      };

      mockProcessPayment.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => usePayment());

      await act(async () => {
        await result.current.submitPayment(mockCardData, 1000, 'GBP');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.success).toBe(false);
      expect(result.current.failed).toBe(true);
      expect(result.current.error).toBe('Insufficient funds');
    });

    it('should handle API exception', async () => {
      mockProcessPayment.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => usePayment());

      await act(async () => {
        await result.current.submitPayment(mockCardData, 1000, 'GBP');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.success).toBe(false);
      expect(result.current.failed).toBe(true);
      expect(result.current.error).toBe('Network error');
    });

    it('should set loading state during payment processing', async () => {
      const mockResponse: PaymentResponse = {
        id: 'pay_123',
        status: 'Authorized',
        approved: true,
        requiresRedirect: false,
      };

      let resolvePayment: (value: PaymentResponse) => void;
      const paymentPromise = new Promise<PaymentResponse>((resolve) => {
        resolvePayment = resolve;
      });

      mockProcessPayment.mockReturnValueOnce(paymentPromise);

      const { result } = renderHook(() => usePayment());

      let submitPromise: Promise<void>;
      act(() => {
        submitPromise = result.current.submitPayment(mockCardData, 1000, 'GBP');
      });

      // Loading should be true while processing
      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePayment!(mockResponse);
        await submitPromise;
      });

      // Loading should be false after completion
      expect(result.current.loading).toBe(false);
    });

    it('should reset state before each payment attempt', async () => {
      const mockResponse: PaymentResponse = {
        id: 'pay_123',
        status: 'Authorized',
        approved: true,
        requiresRedirect: false,
      };

      mockProcessPayment.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => usePayment());

      // First payment
      await act(async () => {
        await result.current.submitPayment(mockCardData, 1000, 'GBP');
      });

      expect(result.current.success).toBe(true);

      // Second payment should reset state
      await act(async () => {
        await result.current.submitPayment(mockCardData, 2000, 'USD');
      });

      expect(result.current.success).toBe(true);
      expect(mockProcessPayment).toHaveBeenCalledTimes(2);
    });
  });

  describe('handle3DSSuccess', () => {
    it('should mark payment as successful and close 3DS', () => {
      const { result } = renderHook(() => usePayment());

      act(() => {
        result.current.handle3DSSuccess();
      });

      expect(result.current.show3DS).toBe(false);
      expect(result.current.success).toBe(true);
      expect(result.current.failed).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('handle3DSFailure', () => {
    it('should mark payment as failed and close 3DS', () => {
      const { result } = renderHook(() => usePayment());

      act(() => {
        result.current.handle3DSFailure();
      });

      expect(result.current.show3DS).toBe(false);
      expect(result.current.success).toBe(false);
      expect(result.current.failed).toBe(true);
      expect(result.current.error).toBe('3D Secure verification failed');
    });
  });

  describe('close3DS', () => {
    it('should close 3DS and set cancellation error', () => {
      const { result } = renderHook(() => usePayment());

      // First show 3DS
      act(() => {
        result.current.handle3DSSuccess(); // Just to set show3DS indirectly
      });

      act(() => {
        result.current.close3DS();
      });

      expect(result.current.show3DS).toBe(false);
      expect(result.current.error).toBe('Payment cancelled');
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      const mockResponse: PaymentResponse = {
        id: 'pay_123',
        status: 'Authorized',
        approved: true,
        requiresRedirect: false,
      };

      mockProcessPayment.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => usePayment());

      // Make a payment to set some state
      await act(async () => {
        await result.current.submitPayment(
          {
            number: '4242424242424242',
            expiryMonth: '12',
            expiryYear: '2025',
            cvv: '123',
            name: 'John Doe',
          },
          1000,
          'GBP'
        );
      });

      expect(result.current.success).toBe(true);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.success).toBe(false);
      expect(result.current.failed).toBe(false);
      expect(result.current.show3DS).toBe(false);
      expect(result.current.redirectUrl).toBe('');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete 3DS flow', async () => {
      const mockResponse: PaymentResponse = {
        id: 'pay_3ds',
        status: 'Pending',
        approved: false,
        requiresRedirect: true,
        redirectUrl: 'https://3ds.checkout.com/verify',
      };

      mockProcessPayment.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => usePayment());

      // Submit payment
      await act(async () => {
        await result.current.submitPayment(
          {
            number: '4242424242424242',
            expiryMonth: '12',
            expiryYear: '2025',
            cvv: '123',
            name: 'John Doe',
          },
          1000,
          'GBP'
        );
      });

      expect(result.current.show3DS).toBe(true);
      expect(result.current.redirectUrl).toBe('https://3ds.checkout.com/verify');

      // Complete 3DS successfully
      act(() => {
        result.current.handle3DSSuccess();
      });

      expect(result.current.show3DS).toBe(false);
      expect(result.current.success).toBe(true);
      expect(result.current.failed).toBe(false);
    });

    it('should handle 3DS cancellation', async () => {
      const mockResponse: PaymentResponse = {
        id: 'pay_3ds',
        status: 'Pending',
        approved: false,
        requiresRedirect: true,
        redirectUrl: 'https://3ds.checkout.com/verify',
      };

      mockProcessPayment.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => usePayment());

      // Submit payment
      await act(async () => {
        await result.current.submitPayment(
          {
            number: '4242424242424242',
            expiryMonth: '12',
            expiryYear: '2025',
            cvv: '123',
            name: 'John Doe',
          },
          1000,
          'GBP'
        );
      });

      expect(result.current.show3DS).toBe(true);

      // User cancels 3DS
      act(() => {
        result.current.close3DS();
      });

      expect(result.current.show3DS).toBe(false);
      expect(result.current.error).toBe('Payment cancelled');
    });

    it('should allow retry after failed payment', async () => {
      const failedResponse: PaymentResponse = {
        id: '',
        status: 'Declined',
        approved: false,
        error: 'Card declined',
      };

      const successResponse: PaymentResponse = {
        id: 'pay_retry',
        status: 'Authorized',
        approved: true,
        requiresRedirect: false,
      };

      mockProcessPayment
        .mockResolvedValueOnce(failedResponse)
        .mockResolvedValueOnce(successResponse);

      const { result } = renderHook(() => usePayment());

      // First attempt fails
      await act(async () => {
        await result.current.submitPayment(
          {
            number: '4242424242424242',
            expiryMonth: '12',
            expiryYear: '2025',
            cvv: '123',
            name: 'John Doe',
          },
          1000,
          'GBP'
        );
      });

      expect(result.current.failed).toBe(true);
      expect(result.current.error).toBe('Card declined');

      // Retry succeeds
      await act(async () => {
        await result.current.submitPayment(
          {
            number: '4242424242424242',
            expiryMonth: '12',
            expiryYear: '2025',
            cvv: '123',
            name: 'John Doe',
          },
          1000,
          'GBP'
        );
      });

      expect(result.current.success).toBe(true);
      expect(result.current.failed).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });
});
