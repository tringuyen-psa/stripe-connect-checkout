# Stripe Connect Checkout System

A Shopify-style checkout system built with Next.js and Stripe Connect that allows users to create products with names and prices, generate checkout URLs, and process credit card payments through Stripe Connect.

## Features

- ✅ Product creation with name and price input
- ✅ Automatic checkout URL generation
- ✅ Shopify-style checkout interface
- ✅ Stripe Connect payment processing
- ✅ Responsive design with Tailwind CSS
- ✅ Form validation with Zod and React Hook Form
- ✅ Stripe Elements for secure payment handling
- ✅ Webhook integration for order management
- ✅ Success/cancel/error handling

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Payment**: Stripe Connect, Stripe Elements, React Stripe.js
- **Forms**: React Hook Form, Zod validation
- **Backend**: Next.js API Routes
- **Styling**: Tailwind CSS, responsive design

## Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- Stripe account with Connect enabled
- Stripe test API keys

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd stripe-connect-checkout

# Install dependencies
npm install
```

### 3. Environment Setup

Copy the example environment file and configure your Stripe keys:

```bash
cp .env.example .env.local
```

Update `.env.local` with your Stripe credentials:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_your_publishable_key
STRIPE_SECRET_KEY_TEST=sk_test_your_secret_key
STRIPE_CONNECT_ACCOUNT_ID_TEST=acct_your_connect_account_id

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Webhook Secret (configure in Stripe Dashboard)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 4. Stripe Setup

1. **Create a Stripe Connect Account**

   - Go to [Stripe Dashboard](https://dashboard.stripe.com/connect)
   - Set up your Connect platform
   - Get your Connect Account ID

2. **Configure Webhooks**
   - In Stripe Dashboard → Webhooks
   - Add endpoint: `http://localhost:3000/api/webhooks`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook secret to your `.env.local`

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

### Creating a Product

1. Visit the homepage
2. Fill in the product form:
   - Product Name (required)
   - Price (required)
   - Currency (optional, defaults to USD)
   - Description (optional)
3. Click "Create Checkout Link"
4. Copy the generated checkout URL or open it directly

### Checkout Flow

1. **Shipping Information**: Customer enters shipping details
2. **Payment**: Secure credit card payment via Stripe Elements
3. **Confirmation**: Order confirmation with details

### API Endpoints

- `POST /api/products` - Create product and checkout session
- `GET /api/checkout?session_id={id}` - Retrieve checkout session details
- `POST /api/webhooks` - Handle Stripe webhook events

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── products/route.ts      # Product creation API
│   │   ├── checkout/route.ts      # Checkout session API
│   │   └── webhooks/route.ts      # Stripe webhook handlers
│   ├── checkout/[sessionId]/      # Dynamic checkout pages
│   ├── success/page.tsx           # Payment success page
│   ├── cancel/page.tsx            # Payment cancelled page
│   └── page.tsx                   # Main product form page
├── components/
│   ├── ProductForm.tsx            # Product input form
│   ├── CheckoutPage.tsx           # Shopify-style checkout
│   └── StripeProvider.tsx         # Stripe context provider
├── lib/
│   ├── stripe-connect.ts          # Stripe Connect integration
│   └── utils.ts                   # Utility functions
└── types/
    └── index.ts                   # TypeScript type definitions
```

## Testing

### Test Cards

Use these Stripe test cards for testing:

| Card Number         | Description        |
| ------------------- | ------------------ |
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Card declined      |
| 4000 0000 0000 9995 | Insufficient funds |

More test cards available in [Stripe Testing Documentation](https://stripe.com/docs/testing).

### Testing with CLI

```bash
# Test product creation
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","price":19.99}'

# Test webhook endpoint
stripe listen --forward-to localhost:3000/api/webhooks
```

## Deployment

### Environment Variables

Make sure to set these in your hosting environment:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST`
- `STRIPE_SECRET_KEY_TEST`
- `STRIPE_CONNECT_ACCOUNT_ID_TEST`
- `NEXT_PUBLIC_APP_URL`
- `STRIPE_WEBHOOK_SECRET`

### Production Webhooks

Update your webhook endpoint URL in Stripe Dashboard to your production URL.

## Security Features

- PCI compliance through Stripe Elements
- Server-side payment processing
- Webhook signature verification
- Input validation and sanitization
- HTTPS enforcement in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support:

- Check the [Stripe Documentation](https://stripe.com/docs)
- Review [Next.js Documentation](https://nextjs.org/docs)
- Open an issue for bugs or feature requests

---

Built with ❤️ using Next.js and Stripe Connect. Check
