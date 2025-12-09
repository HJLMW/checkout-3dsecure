# Checkout.com Payment App

A React Native payment application built with Expo that integrates with Checkout.com's payment gateway, supporting 3D Secure authentication flow.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for macOS) or Android Emulator
- Checkout.com Sandbox account

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the project root by copying the example file:

```bash
cp .env.example .env
```

Update the `.env` file with your Checkout.com sandbox credentials:

```env
EXPO_PUBLIC_CHECKOUT_PUBLIC_KEY=pk_sbox_your_public_key
EXPO_PUBLIC_CHECKOUT_SECRET_KEY=sk_sbox_your_secret_key
```

You can obtain these keys from your [Checkout.com Sandbox Dashboard](https://dashboard.sandbox.checkout.com/).

### 3. Prebuild Native Code

Generate native Android and iOS directories:

```bash
npx expo prebuild --clean
```

### 4. Run the App

**For iOS:**

```bash
npm run ios
```

**For Android:**

```bash
npm run android
```

**Development mode (choose platform from menu):**

```bash
npm start
```

## Project Structure

```
├── api/
│   └── services/
│       └── payments/          # Payment API integration
├── components/                # React components
│   ├── CardForm.tsx          # Credit card input form
│   ├── ThreeDSWebView.tsx    # 3D Secure authentication
│   └── Payment*.tsx          # Payment flow screens
├── hooks/
│   └── usePayment.ts         # Payment logic and state management
├── utils/
│   └── cardValidation.ts     # Card validation utilities
└── assets/                    # Images and SVG files
```

## Implementation Notes

### Architecture Decisions

The app follows a clean separation of concerns:

- **API Layer**: Isolated in `api/services/payments/` to handle Checkout.com integration
- **Business Logic**: Centralized in the `usePayment` hook for reusability
- **UI Components**: Stateless presentational components that receive data via props
- **Validation**: Client-side card validation before API calls

### Key Features

1. **Card Tokenization**: Sensitive card data is tokenized using Checkout.com's public key before payment processing
2. **3D Secure Support**: Implements the full 3DS challenge flow via WebView with deep link handling
3. **Real-time Validation**: Card number, expiry date, and CVV validation with visual feedback
4. **Card Scheme Detection**: Automatic detection of Visa, Mastercard, and Amex

### Assumptions

- **⚠️ Security Note**: For this technical test, the secret key is included in the mobile app to demonstrate the complete 3DS payment flow. **In production, this should NEVER be done.** The correct architecture is:
  1. Mobile app tokenizes card data using the public key
  2. Mobile app sends the token to your secure backend server
  3. Backend server processes the payment using the secret key
  4. Backend server returns the 3DS URL to the mobile app
- Client-side validation is a convenience layer; server-side validation is the source of truth
- Payment amount is hardcoded to £10.00 GBP for demonstration purposes
- The app uses Checkout.com's sandbox environment
- Deep link scheme (`checkoutcc://`) is configured for 3DS redirects

### Areas for Improvement

**Security:**

- The secret key should never be exposed in a mobile app. In production, payment requests should be proxied through a secure backend server
- Implement certificate pinning for API requests
- Add biometric authentication before payment submission

**Testing:**

- Integration tests for the payment flow using mocked API responses
- E2E tests for the complete user journey including 3DS

**User Experience:**

- Add support for saved cards (tokenization storage)
- Implement loading skeletons during API calls
- Add support for multiple currencies
- Improve error messages with actionable recovery steps

**Code Quality:**

- Extract magic numbers (amounts, timeouts) to configuration
- Add proper TypeScript strict mode compliance
- Implement error boundary components
- Add analytics/logging for payment events

**Features:**

- Support for alternative payment methods (Apple Pay, Google Pay)
- Payment history and receipts
- Retry logic with exponential backoff for failed requests
- Offline mode detection and user feedback

### Testing the App

Use these Checkout.com sandbox test cards:

| Scenario           | Card Number         | 3DS | Expiry     | CVV          |
| ------------------ | ------------------- | --- | ---------- | ------------ |
| Success (with 3DS) | 4485 0400 0000 0001 | Yes | Any future | Any 3 digits |
| Declined           | 4000 0000 0000 0119 | Yes | Any future | Any 3 digits |

For 3DS challenges, use any password in the test environment.

## Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run lint` - Run ESLint and Prettier checks
- `npm run format` - Auto-fix linting and formatting issues
- `npm run prebuild` - Generate native project directories

## License

Private project for demonstration purposes.
