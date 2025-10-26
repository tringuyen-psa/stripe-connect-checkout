"use client"

import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { ReactNode } from 'react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripeWrapperProps {
    children: ReactNode
    clientSecret?: string
    amount?: number
    currency?: string
}

export function StripeWrapper({ children, clientSecret, amount, currency = 'usd' }: StripeWrapperProps) {
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