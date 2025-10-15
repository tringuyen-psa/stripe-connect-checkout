# Stripe Subscription Backend (NestJS)

Backend API for Stripe subscription management system built with NestJS, TypeORM, and PostgreSQL.

## Features

- 🏗️ **NestJS Framework** with Dependency Injection
- 🗄️ **TypeORM** with PostgreSQL
- 💳 **Stripe Integration** with Connect Account support
- 📚 **Swagger Documentation** with auto-generated API docs
- ✅ **Data Validation** with class-validator
- 🔄 **Subscription Management** (Create, Cancel, Renew)
- 👥 **User Management** with Stripe customer integration
- 📊 **Payment History** tracking

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: TypeORM
- **Payment**: Stripe API
- **Documentation**: Swagger/OpenAPI

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update environment variables with your credentials
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/stripe_subscriptions

# Stripe (Test Keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_...
STRIPE_SECRET_KEY_TEST=sk_test_...

# Stripe (Live Keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_MAIN=pk_live_...
STRIPE_SECRET_KEY_MAIN=sk_live_...

# Stripe Connect
STRIPE_CONNECT_ACCOUNT_ID_TEST=acct_...
STRIPE_CONNECT_ACCOUNT_ID_MAIN=acct_...

# Server
PORT=3002
NODE_ENV=development
FRONTEND_URL=http://localhost:3001

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Webhooks
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Build for production
npm run build

# Production mode
npm run start:prod
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3002/api/docs
- **API Base URL**: http://localhost:3002

## API Endpoints

### Subscriptions
- `POST /subscriptions/create` - Create new subscription
- `GET /subscriptions/user/:email` - Get user subscriptions
- `GET /subscriptions/plans` - Get available plans
- `POST /subscriptions/:id/cancel` - Cancel subscription
- `POST /subscriptions/:id/renew` - Renew subscription

### Users
- `POST /users` - Create user
- `GET /users/email/:email` - Find user by email
- `GET /users/stripe/:customerId` - Find user by Stripe customer ID

## Database Schema

The application uses the following main tables:

- `users` - User information and Stripe customer IDs
- `subscription_plans` - Available subscription plans
- `user_subscriptions` - User subscription records
- `subscription_payments` - Payment history

## Development

```bash
# Run linting
npm run lint

# Run tests
npm run test

# Build project
npm run build
```

## Deployment

1. Set production environment variables
2. Build the application: `npm run build`
3. Run in production mode: `npm run start:prod`

## License

MIT