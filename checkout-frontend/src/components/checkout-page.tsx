"use client"

import { useState } from "react"
import { ChevronLeft, Lock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OrderSummary } from "./order-summary"
import { PaymentMethods } from "./payment-methods"
import { StripeExpressCheckout } from "./stripe-express-checkout"
import { apiClient } from "@/lib/api"
import { useStripe } from '@stripe/react-stripe-js'
import { useProducts } from "@/context/ProductContext"
import { useRef } from 'react'
import { countryList, getStatesByCountry, Country, State } from "@/lib/countries"

interface CheckoutPageProps {
    clientSecret?: string
}

export function CheckoutPage({ clientSecret }: CheckoutPageProps) {
    const stripe = useStripe()
    const { getTotal, products } = useProducts()
    const cardInputRef = useRef<any>(null)
    const [email, setEmail] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [address, setAddress] = useState("")
    const [apartment, setApartment] = useState("")
    const [city, setCity] = useState("")
    const [selectedState, setSelectedState] = useState("")
    const [zipCode, setZipCode] = useState("")
    const [phone, setPhone] = useState("")
    const [selectedCountry, setSelectedCountry] = useState<Country>(countryList.find(c => c.name === "United States") || countryList[0])
    const [newsletter, setNewsletter] = useState(true)

    // Handle country change and reset state
    const handleCountryChange = (countryName: string) => {
        const country = countryList.find(c => c.name === countryName)
        if (country) {
            setSelectedCountry(country)
            // Reset state when country changes
            setSelectedState("")
        }
        clearError()
    }

    const handleStateChange = (stateName: string) => {
        setSelectedState(stateName)
        clearError()
    }

    // Phone number formatting
    const handlePhoneChange = (value: string) => {
        // Allow international phone formats with +, digits, spaces, dashes, parentheses
        setPhone(value)
        clearError()
    }

    // ZIP code formatting
    const handleZipCodeChange = (value: string) => {
        // Format for international postal codes
        const formatted = value.toUpperCase().replace(/[^A-Z0-9\s-]/g, '')
        setZipCode(formatted)
        clearError()
    }
    const [smsUpdates, setSmsUpdates] = useState(true)
    const [paymentMethod, setPaymentMethod] = useState("credit-card")
    const [saveInfo, setSaveInfo] = useState(true)


    // Payment states
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentError, setPaymentError] = useState<string | null>(null)

    const validateCardInformation = async () => {
        if (!cardInputRef.current) {
            return null
        }
        return await cardInputRef.current.validateCardInformation()
    }

    // Clear payment error when user types in any field
    const clearError = () => {
        if (paymentError) {
            setPaymentError(null)
        }
    }

    // Calculate order total from products context
    const getOrderTotal = () => {
        return getTotal()
    }

    // Handle Express Checkout success
    const handleExpressCheckoutSuccess = async (orderId: string, paymentId: string) => {
        const params = new URLSearchParams({
            orderId,
            paymentId,
            amount: getOrderTotal().toString(),
            currency: 'usd',
            status: 'completed',
            email: email,
            paymentMethod: 'express-checkout'
        })

        window.location.href = '/success?' + params.toString()
    }

    // Handle Express Checkout error
    const handleExpressCheckoutError = (error: string) => {
        setPaymentError(error)
    }

    const handlePlaceOrder = async () => {
        // Check for missing required fields
        const missingFields = []
        if (!email) missingFields.push("Email")
        if (!firstName) missingFields.push("First name")
        if (!lastName) missingFields.push("Last name")
        if (!address) missingFields.push("Address")
        if (!city) missingFields.push("City")
        if (!zipCode) missingFields.push("ZIP code")
        if (!phone) missingFields.push("Phone")

        // Add state validation for countries that have states
        if (selectedCountry.states && selectedCountry.states.length > 0 && !selectedState) {
            missingFields.push("State")
        }

        if (missingFields.length > 0) {
            setPaymentError(`Please fill in the following required fields: ${missingFields.join(", ")}`)
            return
        }

        let paymentMethodData = null
        if (paymentMethod === 'credit-card') {
            console.log('=== Processing credit card payment ===')
            // Validate card information before processing
            paymentMethodData = await validateCardInformation()
            console.log('Payment method validation result:', paymentMethodData)
            if (!paymentMethodData) {
                console.log('Payment method validation failed')
                setPaymentError("Please complete the credit card information.")
                return
            }
            console.log('Setting Stripe payment method:', paymentMethodData.id)
            // Payment method set
            console.log('Payment method ready:', paymentMethodData.id)
        }

        if (products.length === 0) {
            setPaymentError("Your cart is empty. Please add products to your order.")
            return
        }

        setIsProcessing(true)
        setPaymentError(null)

        try {
            // Calculate total amount (convert to cents for Stripe)
            const totalAmount = getOrderTotal() * 100
            const totalAmountForDisplay = getOrderTotal()

            if (paymentMethod === 'credit-card') {
                if (!stripe) {
                    throw new Error('Stripe failed to initialize')
                }

                // Use the actual Stripe payment method created by Stripe Elements
                console.log('Checking paymentMethodData:', paymentMethodData)
                if (!paymentMethodData) {
                    console.log('ERROR: paymentMethodData is null or undefined')
                    throw new Error('Payment method not created')
                }

                // Create payment intent using platform account
                const paymentIntentResponse = await apiClient.createPaymentIntent({
                    amount: Math.round(totalAmount),
                    currency: 'usd',
                    customerEmail: email,
                    paymentMethodId: paymentMethodData.id,
                    stripeAccountId: process.env.NEXT_PUBLIC_STRIPE_ACCOUNT_ID
                })

                if (paymentIntentResponse.error || !paymentIntentResponse.data) {
                    throw new Error(paymentIntentResponse.error || 'Failed to create payment intent')
                }

                // For testing, we'll simulate successful payment confirmation
                const { clientSecret, paymentIntentId } = paymentIntentResponse.data as any
                console.log('Payment intent created successfully:', { clientSecret, paymentIntentId })

                // Confirm the payment intent using the backend confirmation endpoint
                console.log('Confirming payment intent:', paymentIntentId)
                const confirmResponse = await apiClient.confirmCardPayment({
                    paymentIntentId: paymentIntentId,
                    paymentMethodId: paymentMethodData.id,
                    stripeAccountId: process.env.NEXT_PUBLIC_STRIPE_ACCOUNT_ID
                })

                if (confirmResponse.error || !confirmResponse.data) {
                    throw new Error(confirmResponse.error || 'Failed to confirm payment')
                }

                console.log('Payment confirmed successfully:', confirmResponse.data)

                // Create order after successful payment confirmation
                const orderItems = products.map(product => ({
                    name: product.name,
                    price: product.price,
                    quantity: product.quantity
                }))

                const orderResponse = await apiClient.createOrder({
                    paymentIntentId: paymentIntentId,
                    items: orderItems,
                    customer: {
                        email,
                        firstName,
                        lastName,
                        phone,
                        address: `${address}${apartment ? `, ${apartment}` : ''}`,
                        city,
                        state: selectedState,
                        country: selectedCountry.name,
                        postalCode: zipCode,
                    },
                    subtotal: getOrderTotal(),
                    tax: 0,
                    shipping: 0,
                    total: getOrderTotal(),
                    currency: 'usd',
                    paymentMethodId: paymentMethodData.id,
                    isExpressCheckout: false,
                })

                if (orderResponse.error) {
                    throw new Error(orderResponse.error || 'Failed to create order')
                }

                // Redirect to success page with payment details
                const orderId = (orderResponse.data as any)?.id

                const params = new URLSearchParams({
                    orderId: orderId || 'unknown',
                    paymentId: paymentIntentId || 'unknown',
                    amount: totalAmountForDisplay.toString(),
                    currency: 'usd',
                    status: 'completed',
                    email: email,
                    paymentMethod: 'credit-card'
                })

                window.location.href = '/success?' + params.toString()
            } else {
                // Handle other payment methods (Shop Pay, etc.)
                setPaymentError("This payment method is not implemented yet.")
            }

        } catch (error) {
            console.error('Payment error:', error)
            setPaymentError(error instanceof Error ? error.message : 'Payment failed. Please try again.')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
                            <ChevronLeft className="w-4 h-4" />
                            <span>Edit Order</span>
                        </Link>
                        <div className="w-24" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Form */}
                    <div className="space-y-6">
                        {/* Express Checkout */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <StripeExpressCheckout
                                customerEmail={email}
                                customerInfo={{
                                    name: `${firstName} ${lastName}`,
                                    address: {
                                        line1: address,
                                        line2: apartment || undefined,
                                        city: city,
                                        state: selectedState,
                                        postal_code: zipCode,
                                        country: selectedCountry.name
                                    }
                                }}
                                onSuccess={handleExpressCheckoutSuccess}
                                onError={handleExpressCheckoutError}
                                disabled={isProcessing || getTotal() === 0}
                                clientSecret={clientSecret}
                            />
                            <p className="text-xs text-gray-500 text-center mb-3">
                                By continuing with your payment, you agree to the future charges listed on this page and the cancellation policy.
                            </p>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">OR</span>
                                </div>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h2 className="text-lg font-semibold mb-4">Contact</h2>
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    clearError()
                                }}
                                className="border-gray-300"
                            />
                            <div className="flex items-start gap-3 mt-4">
                                {/* <Checkbox
                                    checked={newsletter}
                                    onCheckedChange={(checked: boolean) => setNewsletter(checked)}
                                    className="mt-1"
                                /> */}
                                {/* <label className="text-sm text-gray-700">
                                    Stay committed with tips, inspiration, and community.
                                </label> */}
                            </div>
                        </div>

                        {/* Delivery */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h2 className="text-lg font-semibold mb-4">Delivery</h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        placeholder="First name"
                                        value={firstName}
                                        onChange={(e) => {
                                            setFirstName(e.target.value)
                                            clearError()
                                        }}
                                        className="border-gray-300"
                                    />
                                    <Input
                                        placeholder="Last name"
                                        value={lastName}
                                        onChange={(e) => {
                                            setLastName(e.target.value)
                                            clearError()
                                        }}
                                        className="border-gray-300"
                                    />
                                </div>

                                <Input
                                    placeholder="Address"
                                    value={address}
                                    onChange={(e) => {
                                        setAddress(e.target.value)
                                        clearError()
                                    }}
                                    className="border-gray-300"
                                />

                                <Input
                                    placeholder="Apartment, suite, unit, etc. (optional)"
                                    value={apartment}
                                    onChange={(e) => setApartment(e.target.value)}
                                    className="border-gray-300"
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        placeholder="City"
                                        value={city}
                                        onChange={(e) => {
                                            setCity(e.target.value)
                                            clearError()
                                        }}
                                        className="border-gray-300"
                                    />
                                    <Input
                                        placeholder="State/Province"
                                        value={selectedState}
                                        onChange={(e) => {
                                            setSelectedState(e.target.value)
                                            clearError()
                                        }}
                                        className="border-gray-300"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        placeholder="ZIP/Postal code"
                                        value={zipCode}
                                        onChange={(e) => handleZipCodeChange(e.target.value)}
                                        className="border-gray-300"
                                    />
                                    <Input
                                        placeholder="Country"
                                        value={selectedCountry.name}
                                        onChange={(e) => {
                                            const country = countryList.find(c => c.name === e.target.value)
                                            if (country) {
                                                setSelectedCountry(country)
                                            }
                                            clearError()
                                        }}
                                        className="border-gray-300"
                                    />
                                </div>

                                <Input
                                    placeholder="Phone number"
                                    value={phone}
                                    onChange={(e) => handlePhoneChange(e.target.value)}
                                    className="border-gray-300"
                                />

                                <div className="flex items-start gap-3">
                                    {/* <Checkbox
                                        checked={smsUpdates}
                                        onCheckedChange={(checked: boolean) => setSmsUpdates(checked)}
                                        className="mt-1"
                                    /> */}
                                    {/* <label className="text-sm text-gray-700">
                                        Text me when my AG1 ships and about exclusive health and science content
                                    </label> */}
                                </div>
                            </div>
                        </div>


                        {/* Shipping Method */}
                        {/* <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h2 className="text-lg font-semibold mb-2">Shipping method</h2>
                            <p className="text-sm text-gray-500">
                                Enter your shipping address to view available shipping methods.
                            </p>
                        </div> */}

                        {/* Payment */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h2 className="text-lg font-semibold mb-2">Payment</h2>
                            <p className="text-sm text-gray-500 mb-4">All transactions are secure and encrypted.</p>
                            <PaymentMethods
                                paymentMethod={paymentMethod}
                                setPaymentMethod={setPaymentMethod}
                                onValidateCard={validateCardInformation}
                                cardRef={cardInputRef}
                                isProcessing={isProcessing}
                                paymentError={paymentError}
                            />
                        </div>

                        {/* Remember Me */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <h2 className="text-lg font-semibold mb-4">Remember me</h2>
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    checked={saveInfo}
                                    onCheckedChange={(checked: boolean) => setSaveInfo(checked)}
                                    className="mt-1"
                                />
                                <label className="text-sm text-gray-700">
                                    Save my information for a faster checkout with a Shop account
                                </label>
                            </div>
                        </div>

                        {/* Payment Error Display */}
                        {paymentError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-800">{paymentError}</p>
                                </div>
                            </div>
                        )}

                        {/* Place Order Button */}
                        <Button
                            className="w-full h-14 text-base font-semibold text-white"
                            style={{ backgroundColor: '#1a5f3f', borderRadius: '6px' }}
                            onClick={handlePlaceOrder}
                            disabled={isProcessing || getOrderTotal() === 0}
                        >
                            {isProcessing ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </div>
                            ) : (
                                `Place Order • $${getOrderTotal().toFixed(2)}`
                            )}
                        </Button>

                        {/* Footer */}
                        <div className="space-y-3 text-xs text-gray-600 pb-8">
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                <span>Secure and encrypted</span>
                            </div>
                            <p>
                                By placing this order, you agree to the{" "}
                                <a href="#" className="underline hover:text-gray-900">
                                    Terms of Service
                                </a>{" "}
                                and{" "}
                                <a href="#" className="underline hover:text-gray-900">
                                    Privacy Policy
                                </a>
                            </p>
                            <p>
                                If you're signing up for a subscription, you authorize DrinkAG1 to charge any on-file payment method
                                every 30 days at the then current rate. Your subscription will renew automatically until you cancel,
                                which you can do any time prior to the next bill within your member account or by contacting customer
                                service.
                            </p>
                        </div>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div>
                        <OrderSummary />
                    </div>
                </div>
            </div>
        </div>
    )
}