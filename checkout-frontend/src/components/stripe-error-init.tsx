"use client"

import { useEffect } from 'react'
import { setupStripeErrorHandler } from '@/lib/stripe-error-handler'

export function StripeErrorInit() {
  useEffect(() => {
    setupStripeErrorHandler()
  }, [])

  return null
}