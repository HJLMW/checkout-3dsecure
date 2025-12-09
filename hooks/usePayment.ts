import { useState } from 'react';
import { processPayment } from '../api/services/payments/payments';
import type { CardData, PaymentResponse } from '../api/services/payments/types';

interface UsePaymentReturn {
  /** Indicates if a payment transaction is currently in progress */
  loading: boolean;
  /** Error message from the payment process, or null if no error occurred */
  error: string | null;
  /** Indicates if the payment was successfully completed */
  success: boolean;
  /** Indicates if the payment failed or was declined */
  failed: boolean;
  /** Indicates if the 3D Secure authentication WebView should be displayed */
  show3DS: boolean;
  /** The URL for 3D Secure authentication redirect */
  redirectUrl: string;
  /**
   * Initiates a payment transaction with the provided card details
   * @param card - Card data including number, expiry, CVV, and cardholder name
   * @param amount - Payment amount in smallest currency unit (e.g., cents)
   * @param currency - Three-letter ISO currency code (e.g., 'USD', 'EUR')
   */
  submitPayment: (card: CardData, amount: number, currency: string) => Promise<void>;
  /**
   * Handles successful 3D Secure authentication
   * Marks the payment as successful and hides the 3DS WebView
   */
  handle3DSSuccess: () => void;
  /**
   * Handles failed 3D Secure authentication
   * Marks the payment as failed and hides the 3DS WebView
   */
  handle3DSFailure: () => void;
  /**
   * Closes the 3D Secure WebView without completing authentication
   * Marks the payment as cancelled
   */
  close3DS: () => void;
  /**
   * Resets all payment state to initial values
   * Use this to start a new payment flow
   */
  reset: () => void;
}

export const usePayment = (): UsePaymentReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [failed, setFailed] = useState(false);
  const [show3DS, setShow3DS] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');

  const submitPayment = async (card: CardData, amount: number, currency: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setFailed(false);
    setShow3DS(false);

    try {
      const result = await processPayment({ card, amount, currency });

      if (result.error) {
        setError(result.error);
        setSuccess(false);
        setFailed(true);
      } else if (result.requiresRedirect && result.redirectUrl) {
        // 3DS required - show WebView
        setRedirectUrl(result.redirectUrl);
        setShow3DS(true);
      } else if (result.approved) {
        setSuccess(true);
        setFailed(false);
        setError(null);
      } else {
        setError('Payment was declined');
        setSuccess(false);
        setFailed(true);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setSuccess(false);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const handle3DSSuccess = () => {
    setShow3DS(false);
    setSuccess(true);
    setFailed(false);
    setError(null);
  };

  const handle3DSFailure = () => {
    setShow3DS(false);
    setError('3D Secure verification failed');
    setSuccess(false);
    setFailed(true);
  };

  const close3DS = () => {
    setShow3DS(false);
    setError('Payment cancelled');
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setSuccess(false);
    setFailed(false);
    setShow3DS(false);
    setRedirectUrl('');
  };

  return {
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
  };
};
