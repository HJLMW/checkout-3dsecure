export interface CardData {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  name: string;
}

export interface PaymentRequest {
  card: CardData;
  amount: number;
  currency: string;
}

export interface PaymentResponse {
  id: string;
  status: 'Authorized' | 'Pending' | 'Declined';
  approved: boolean;
  requiresRedirect?: boolean;
  redirectUrl?: string;
  error?: string;
}

export interface PaymentDetails {
  id: string;
  status: string;
  amount: number;
  currency: string;
  approved: boolean;
  '3ds'?: {
    enrolled: boolean;
    authenticated: boolean;
  };
}
