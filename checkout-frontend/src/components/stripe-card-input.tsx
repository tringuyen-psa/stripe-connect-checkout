"use client"

import { useState, forwardRef, useImperativeHandle, useEffect } from 'react'
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { CountriesService, CountryOption } from './country.service'

interface StripeCardInputProps {
    onCardChange: (isComplete: boolean) => void
    isProcessing: boolean
    error: string | null
}

const StripeCardInput = forwardRef<any, StripeCardInputProps>(
    ({ onCardChange, isProcessing, error }, ref) => {
        const stripe = useStripe()
        const elements = useElements()
        const [nameOnCard, setNameOnCard] = useState("")
        const [country, setCountry] = useState("")
        const [countries, setCountries] = useState<CountryOption[]>([])
        const [isLoadingCountries, setIsLoadingCountries] = useState(true)
        const [inputError, setInputError] = useState<string | null>(null)
        const [isCardComplete, setIsCardComplete] = useState(false)

        // Load countries from API on component mount
        useEffect(() => {
            const loadCountries = async () => {
                try {
                    setIsLoadingCountries(true)
                    const countryOptions = await CountriesService.getCountriesForSelect()
                    setCountries(countryOptions)
                } catch (error) {
                    console.error('Failed to load countries:', error)
                } finally {
                    setIsLoadingCountries(false)
                }
            }

            loadCountries()
        }, [])

        const handleCardChange = (event: any) => {
            if (event.complete) {
                setIsCardComplete(true)
            } else {
                setIsCardComplete(false)
            }
            // Notify parent component about card completion status
            onCardChange(event.complete)
        }

        const validateCardInformation = async () => {
            console.log('=== validateCardInformation started ===')
            setInputError(null)

            if (!stripe || !elements) {
                console.log('Stripe or elements not loaded')
                setInputError("Stripe has not loaded yet")
                return null
            }

            console.log('Checking nameOnCard:', nameOnCard.trim())
            if (!nameOnCard.trim()) {
                console.log('Name on card is empty')
                setInputError("Please enter name on card")
                return null
            }

            console.log('Checking country:', country)
            if (!country) {
                console.log('Country is empty')
                setInputError("Please select country")
                return null
            }

            console.log('Checking isCardComplete:', isCardComplete)
            if (!isCardComplete) {
                console.log('Card is not complete')
                setInputError("Please complete all card details")
                return null
            }

            const cardNumberElement = elements.getElement(CardNumberElement)
            const cardExpiryElement = elements.getElement(CardExpiryElement)
            const cardCvcElement = elements.getElement(CardCvcElement)

            console.log('Card elements:', {
                hasCardNumber: !!cardNumberElement,
                hasCardExpiry: !!cardExpiryElement,
                hasCardCvc: !!cardCvcElement
            })

            if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
                console.log('Some card elements are missing')
                setInputError("Card details not complete")
                return null
            }

            try {
                console.log('Creating Stripe payment method...')
                const { error, paymentMethod } = await stripe.createPaymentMethod({
                    type: 'card',
                    card: cardNumberElement,
                    billing_details: {
                        name: nameOnCard,
                        address: {
                            country: country.toUpperCase()
                        }
                    }
                })

                console.log('Stripe response:', { error, paymentMethod })

                if (error) {
                    console.log('Stripe error:', error)
                    setInputError(error.message || "Payment method creation failed")
                    return null
                }

                if (paymentMethod) {
                    console.log('Payment method created successfully:', paymentMethod.id)
                    return {
                        id: paymentMethod.id,
                        card: paymentMethod.card
                    }
                }
            } catch (err) {
                console.log('Unexpected error:', err)
                setInputError("An unexpected error occurred")
                return null
            }

            console.log('Payment method creation failed - unknown reason')
            return null
        }

        // Expose validation function via ref
        useImperativeHandle(ref, () => ({
            validateCardInformation
        }))

        const elementOptions = {
            style: {
                base: {
                    fontSize: '16px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    color: '#374151',
                    '::placeholder': {
                        color: '#9CA3AF'
                    }
                },
                invalid: {
                    color: '#DC2626'
                }
            },
            placeholder: ''
        }

        return (
            <div className="space-y-4">
                {/* Card Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number
                    </label>
                    <div className="border border-gray-300 rounded-lg p-3 bg-white">
                        <CardNumberElement
                            options={{ ...elementOptions, placeholder: '1234 1234 1234 1234' }}
                            className="outline-none"
                            onChange={handleCardChange}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Expiration Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiration Date
                        </label>
                        <div className="border border-gray-300 rounded-lg p-3 bg-white">
                            <CardExpiryElement
                                options={{ ...elementOptions, placeholder: 'MM/YY' }}
                                className="outline-none"
                                onChange={handleCardChange}
                            />
                        </div>
                    </div>

                    {/* Security Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Security Code
                        </label>
                        <div className="border border-gray-300 rounded-lg p-3 bg-white">
                            <CardCvcElement
                                options={{ ...elementOptions, placeholder: '123' }}
                                className="outline-none"
                                onChange={handleCardChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Name on Card */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name on Card
                    </label>
                    <Input
                        placeholder="John Doe"
                        value={nameOnCard}
                        onChange={(e) => {
                            setNameOnCard(e.target.value)
                            setInputError(null)
                        }}
                        disabled={isProcessing}
                    />
                </div>

                {/* Country */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country or Region
                    </label>
                    <Select value={country} onValueChange={(value) => {
                        setCountry(value)
                        setInputError(null)
                    }} disabled={isProcessing || isLoadingCountries}>
                        <SelectTrigger className="w-full border-gray-300 bg-white hover:bg-gray-50 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue placeholder={isLoadingCountries ? "Loading countries..." : "Select country"} />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-300 shadow-lg z-50 max-h-60 overflow-y-auto">
                            {countries.map((countryOption) => (
                                <SelectItem key={countryOption.code} value={countryOption.code} className="hover:bg-gray-100 focus:bg-blue-50">
                                    {countryOption.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {isLoadingCountries && (
                        <p className="text-xs text-gray-500 mt-1">Loading countries from server...</p>
                    )}
                </div>

                {/* Input Error Display */}
                {inputError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">{inputError}</p>
                        </div>
                    </div>
                )}

                {/* General Error Display */}
                {error && !inputError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    </div>
                )}
            </div>
        )
    }
)

StripeCardInput.displayName = 'StripeCardInput'

export { StripeCardInput }