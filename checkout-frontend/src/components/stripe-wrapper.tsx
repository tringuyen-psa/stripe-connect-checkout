"use client"

import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { ReactNode } from 'react'

// Validate Stripe key before loading
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!stripeKey) {
  console.error('❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
}

// Load Stripe with connected account if specified
const stripePromise = stripeKey ? loadStripe(stripeKey, {
  stripeAccount: process.env.NEXT_PUBLIC_STRIPE_ACCOUNT_ID,
}) : Promise.resolve(null);

interface StripeWrapperProps {
    children: ReactNode
    clientSecret?: string
    amount?: number
    currency?: string
}

export function StripeWrapper({ children, clientSecret, amount, currency = 'usd' }: StripeWrapperProps) {
    // Show error if Stripe key is not available
    if (!stripeKey) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
                    <div className="text-red-600 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Payment System Configuration Error</h2>
                    <p className="text-gray-600 mb-4">
                        Stripe payment system is not properly configured. Please contact support.
                    </p>
                    <p className="text-sm text-gray-500">
                        Error: Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
                    </p>
                </div>
            </div>
        )
    }

    // Configure Elements with proper options according to Stripe docs
    const options = amount ? {
        mode: 'payment' as const,
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        appearance: {
            theme: 'stripe' as const,
            variables: {
                colorPrimary: '#1a5f3f', // AG1 brand color
                colorBackground: '#ffffff',
                colorText: '#1f2937',
                colorDanger: '#dc2626',
                fontFamily: 'system-ui, sans-serif',
                spacingUnit: '4px',
                borderRadius: '6px',
            },
        },
        locale: 'en' as const, // Set locale based on user preference
    } : {
        appearance: {
            theme: 'stripe' as const,
            variables: {
                colorPrimary: '#1a5f3f',
                colorBackground: '#ffffff',
                colorText: '#1f2937',
                colorDanger: '#dc2626',
                fontFamily: 'system-ui, sans-serif',
                spacingUnit: '4px',
                borderRadius: '6px',
            },
        },
        locale: 'en' as const,
    }

    return (
        <Elements stripe={stripePromise} options={options}>
            {children}
        </Elements>
    )
}