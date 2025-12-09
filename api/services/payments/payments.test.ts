import * as paymentsModule from './payments';
import type { PaymentRequest } from './types';

const { processPayment, getPaymentDetails } = paymentsModule;

describe('Payment Service', () => {
  let mockPublicPost: jest.SpyInstance;
  let mockSecretPost: jest.SpyInstance;
  let mockSecretGet: jest.SpyInstance;

  beforeEach(() => {
    // Spy on the axios client methods
    mockPublicPost = jest.spyOn(paymentsModule.publicClient, 'post');
    mockSecretPost = jest.spyOn(paymentsModule.secretClient, 'post');
    mockSecretGet = jest.spyOn(paymentsModule.secretClient, 'get');

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  describe('processPayment', () => {
    const mockPaymentRequest: PaymentRequest = {
      card: {
        number: '4242424242424242',
        expiryMonth: '12',
        expiryYear: '2025',
        cvv: '123',
        name: 'John Doe',
      },
      amount: 1000,
      currency: 'GBP',
    };

    it('should successfully process payment without 3DS', async () => {
      mockPublicPost.mockResolvedValueOnce({
        data: { token: 'tok_test123' },
      });

      mockSecretPost.mockResolvedValueOnce({
        data: {
          id: 'pay_success123',
          status: 'Authorized',
          approved: true,
          _links: {},
        },
      });

      const result = await processPayment(mockPaymentRequest);

      expect(result).toEqual({
        id: 'pay_success123',
        status: 'Authorized',
        approved: true,
        requiresRedirect: false,
        redirectUrl: undefined,
      });
      expect(mockPublicPost).toHaveBeenCalledTimes(1);
      expect(mockSecretPost).toHaveBeenCalledTimes(1);
    });

    it('should handle payment requiring 3DS authentication', async () => {
      mockPublicPost.mockResolvedValueOnce({
        data: { token: 'tok_3ds123' },
      });

      mockSecretPost.mockResolvedValueOnce({
        data: {
          id: 'pay_3ds456',
          status: 'Pending',
          approved: false,
          _links: {
            redirect: {
              href: 'https://3ds.checkout.com/verify?session=abc123',
            },
          },
        },
      });

      const result = await processPayment(mockPaymentRequest);

      expect(result).toEqual({
        id: 'pay_3ds456',
        status: 'Pending',
        approved: false,
        requiresRedirect: true,
        redirectUrl: 'https://3ds.checkout.com/verify?session=abc123',
      });
    });

    it('should handle tokenization failure', async () => {
      mockPublicPost.mockRejectedValueOnce({
        response: {
          data: {
            error_codes: ['card_invalid'],
          },
        },
      });

      const result = await processPayment(mockPaymentRequest);

      expect(result).toEqual({
        id: '',
        status: 'Declined',
        approved: false,
        error: 'Payment failed',
      });
    });

    it('should handle payment processing failure with error codes', async () => {
      mockPublicPost.mockResolvedValueOnce({
        data: { token: 'tok_test123' },
      });

      mockSecretPost.mockRejectedValueOnce({
        response: {
          data: {
            error_codes: ['insufficient_funds', 'card_declined'],
          },
        },
      });

      const result = await processPayment(mockPaymentRequest);

      expect(result).toEqual({
        id: '',
        status: 'Declined',
        approved: false,
        error: 'insufficient_funds, card_declined',
      });
    });

    it('should handle network errors during tokenization', async () => {
      mockPublicPost.mockRejectedValueOnce(new Error('Network error'));

      const result = await processPayment(mockPaymentRequest);

      expect(result).toEqual({
        id: '',
        status: 'Declined',
        approved: false,
        error: 'Payment failed',
      });
    });

    it('should handle network errors during payment processing', async () => {
      mockPublicPost.mockResolvedValueOnce({
        data: { token: 'tok_test123' },
      });

      mockSecretPost.mockRejectedValueOnce(new Error('Network error'));

      const result = await processPayment(mockPaymentRequest);

      expect(result).toEqual({
        id: '',
        status: 'Declined',
        approved: false,
        error: 'Payment failed',
      });
    });

    it('should send correct tokenization request', async () => {
      mockPublicPost.mockResolvedValueOnce({
        data: { token: 'tok_test123' },
      });

      mockSecretPost.mockResolvedValueOnce({
        data: {
          id: 'pay_123',
          status: 'Authorized',
          approved: true,
        },
      });

      await processPayment(mockPaymentRequest);

      expect(mockPublicPost).toHaveBeenCalledWith('/tokens', {
        type: 'card',
        number: '4242424242424242',
        expiry_month: 12,
        expiry_year: 2025,
        cvv: '123',
        name: 'John Doe',
      });
    });

    it('should send correct payment request with token', async () => {
      mockPublicPost.mockResolvedValueOnce({
        data: { token: 'tok_abc123' },
      });

      mockSecretPost.mockResolvedValueOnce({
        data: { id: 'pay_123', status: 'Authorized', approved: true },
      });

      await processPayment(mockPaymentRequest);

      expect(mockSecretPost).toHaveBeenCalledWith('/payments', {
        source: {
          type: 'token',
          token: 'tok_abc123',
        },
        amount: 1000,
        currency: 'GBP',
        '3ds': {
          enabled: true,
        },
        success_url: 'checkoutcc://payment/success',
        failure_url: 'checkoutcc://payment/failure',
      });
    });

    it('should handle payment with no _links object', async () => {
      mockPublicPost.mockResolvedValueOnce({
        data: { token: 'tok_test123' },
      });

      mockSecretPost.mockResolvedValueOnce({
        data: {
          id: 'pay_nolinks',
          status: 'Authorized',
          approved: true,
        },
      });

      const result = await processPayment(mockPaymentRequest);

      expect(result.requiresRedirect).toBe(false);
      expect(result.redirectUrl).toBeUndefined();
    });

    it('should handle pending status without redirect link', async () => {
      mockPublicPost.mockResolvedValueOnce({
        data: { token: 'tok_test123' },
      });

      mockSecretPost.mockResolvedValueOnce({
        data: {
          id: 'pay_pending',
          status: 'Pending',
          approved: false,
          _links: {},
        },
      });

      const result = await processPayment(mockPaymentRequest);

      expect(result.requiresRedirect).toBe(false);
    });

    it('should default approved to false if not provided', async () => {
      mockPublicPost.mockResolvedValueOnce({
        data: { token: 'tok_test123' },
      });

      mockSecretPost.mockResolvedValueOnce({
        data: {
          id: 'pay_noapproved',
          status: 'Authorized',
        },
      });

      const result = await processPayment(mockPaymentRequest);

      expect(result.approved).toBe(false);
    });

    it('should handle error without error_codes', async () => {
      mockPublicPost.mockResolvedValueOnce({
        data: { token: 'tok_test123' },
      });

      mockSecretPost.mockRejectedValueOnce({
        response: {
          data: {
            error_message: 'Internal server error',
          },
        },
      });

      const result = await processPayment(mockPaymentRequest);

      expect(result.error).toBe('Payment failed');
    });

    it('should parse expiry dates as integers', async () => {
      mockPublicPost.mockResolvedValueOnce({
        data: { token: 'tok_test123' },
      });

      mockSecretPost.mockResolvedValueOnce({
        data: { id: 'pay_123', status: 'Authorized', approved: true },
      });

      await processPayment({
        card: {
          number: '4242424242424242',
          expiryMonth: '08',
          expiryYear: '2026',
          cvv: '456',
          name: 'Jane Doe',
        },
        amount: 2000,
        currency: 'USD',
      });

      expect(mockPublicPost).toHaveBeenCalledWith(
        '/tokens',
        expect.objectContaining({
          expiry_month: 8,
          expiry_year: 2026,
        })
      );
    });
  });

  describe('getPaymentDetails', () => {
    it('should successfully retrieve payment details', async () => {
      const mockPaymentDetails = {
        id: 'pay_details123',
        status: 'Authorized',
        amount: 1000,
        currency: 'GBP',
        approved: true,
      };

      mockSecretGet.mockResolvedValueOnce({
        data: mockPaymentDetails,
      });

      const result = await getPaymentDetails('pay_details123');

      expect(result).toEqual(mockPaymentDetails);
      expect(mockSecretGet).toHaveBeenCalledWith('/payments/pay_details123');
    });

    it('should throw error when payment not found', async () => {
      const error = {
        response: {
          status: 404,
          data: {
            error_type: 'resource_not_found',
          },
        },
      };

      mockSecretGet.mockRejectedValueOnce(error);

      await expect(getPaymentDetails('pay_notfound')).rejects.toEqual(error);
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      mockSecretGet.mockRejectedValueOnce(error);

      await expect(getPaymentDetails('pay_network')).rejects.toThrow('Network error');
    });

    it('should handle server errors', async () => {
      const error = {
        response: {
          status: 500,
          data: {
            error_message: 'Internal server error',
          },
        },
      };

      mockSecretGet.mockRejectedValueOnce(error);

      await expect(getPaymentDetails('pay_error')).rejects.toEqual(error);
    });
  });
});
