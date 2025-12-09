import axios from 'axios';
import type { PaymentRequest, PaymentResponse, PaymentDetails } from './types';

// Configuration
const API_BASE_URL = 'https://api.sandbox.checkout.com';
const PUBLIC_KEY = process.env.EXPO_PUBLIC_CHECKOUT_PUBLIC_KEY || '';

// The secret key should NEVER be stored in a mobile app in production.
// This implementation is only for the technical test to demonstrate the full 3DS flow.
// In a production environment:
// - The mobile app should only handle tokenization using the PUBLIC_KEY
// - Payment requests must be made from a secure backend server
// - The secret key should only exist server-side, never exposed to clients
const SECRET_KEY = process.env.EXPO_PUBLIC_CHECKOUT_SECRET_KEY || '';

// Axios client with public key (for tokenization)
export const publicClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: PUBLIC_KEY,
  },
});

// Axios client with secret key (for payments)
export const secretClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: SECRET_KEY,
  },
});

/**
 * Step 1: Tokenize card using public key
 */
const tokenizeCard = async (card: PaymentRequest['card']) => {
  try {
    const response = await publicClient.post('/tokens', {
      type: 'card',
      number: card.number,
      expiry_month: parseInt(card.expiryMonth),
      expiry_year: parseInt(card.expiryYear),
      cvv: card.cvv,
      name: card.name,
    });

    return response.data.token;
  } catch (error: any) {
    console.error('Tokenization error:', error.response?.data || error.message);
    throw new Error('Failed to tokenize card');
  }
};

/**
 * Process a card payment
 *
 * NOTE: In production, this function should run on a secure backend server.
 * The secret key must never be exposed to client applications.
 *
 * Production flow:
 * 1. Mobile app: Tokenize card using public key (✓ safe)
 * 2. Mobile app: Send token to backend API
 * 3. Backend server: Process payment using secret key
 * 4. Backend server: Return 3DS URL to mobile app
 *
 * Step 1: Tokenize card with public key
 * Step 2: Process payment with token using secret key
 */
export const processPayment = async (data: PaymentRequest): Promise<PaymentResponse> => {
  try {
    // Step 1: Tokenize the card
    const cardToken = await tokenizeCard(data.card);

    // Step 2: Process the payment with the token
    const response = await secretClient.post('/payments', {
      source: {
        type: 'token',
        token: cardToken,
      },
      amount: data.amount,
      currency: data.currency,
      '3ds': {
        enabled: true,
      },
      success_url: 'checkoutcc://payment/success',
      failure_url: 'checkoutcc://payment/failure',
    });

    const payment = response.data;

    return {
      id: payment.id,
      status: payment.status,
      approved: payment.approved || false,
      requiresRedirect: payment.status === 'Pending' && !!payment._links?.redirect,
      redirectUrl: payment._links?.redirect?.href,
    };
  } catch (error: any) {
    console.error('Payment error:', error.response?.data || error.message);

    return {
      id: '',
      status: 'Declined',
      approved: false,
      error: error.response?.data?.error_codes?.join(', ') || 'Payment failed',
    };
  }
};

/**
 * Get payment details
 */
export const getPaymentDetails = async (paymentId: string): Promise<PaymentDetails> => {
  try {
    const response = await secretClient.get(`/payments/${paymentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment:', error);
    throw error;
  }
};
