"use client"

import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { ReactNode } from 'react'

// Load Stripe outside of component rendering to avoid recreating the `Stripe` object
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripeWrapperProps {
    children: ReactNode
}

export function StripeWrapper({ children }: StripeWrapperProps) {
    return (
        <Elements stripe={stripePromise}>
            {children}
        </Elements>
    )
}