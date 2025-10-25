"use client"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { StripeCardInput } from "./stripe-card-input"

interface PaymentMethodsProps {
    paymentMethod: string
    setPaymentMethod: (method: string) => void
    isProcessing: boolean
    paymentError: string | null
    onValidateCard?: () => Promise<any>
    cardRef?: React.RefObject<any>
}

export function PaymentMethods({ paymentMethod, setPaymentMethod, isProcessing, paymentError, onValidateCard, cardRef }: PaymentMethodsProps) {
    const [billingAddress, setBillingAddress] = useState(true)
    const [isCardComplete, setIsCardComplete] = useState(false)

    // Expose validation function to parent
    const validateCard = async () => {
        if (cardRef?.current) {
            return await cardRef.current.validateCardInformation()
        }
        return null
    }

    return (
        <div className="space-y-3">
            {/* Credit Card */}
            <div
                className={`border rounded-lg ${paymentMethod === "credit-card" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                    }`}
            >
                <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="credit-card" id="credit-card" />
                                    <label htmlFor="credit-card" className="font-semibold text-sm cursor-pointer">
                                        Credit card
                                    </label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Visa Logo */}
                            <div className="relative">
                                <svg width="42" height="26" viewBox="0 0 42 26" fill="none" className="drop-shadow-sm">
                                    <rect width="42" height="26" rx="4" fill="url(#visaGradient)"/>
                                    <defs>
                                        <linearGradient id="visaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" style={{stopColor: '#1A1F71'}}/>
                                            <stop offset="100%" style={{stopColor: '#1434CB'}}/>
                                        </linearGradient>
                                    </defs>
                                    <text x="21" y="17" fontSize="11" fontWeight="800" fill="white" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="1">VISA</text>
                                </svg>
                            </div>

                            {/* Mastercard Logo */}
                            <div className="relative">
                                <svg width="42" height="26" viewBox="0 0 42 26" fill="none" className="drop-shadow-sm">
                                    <rect width="42" height="26" rx="4" fill="#F5F5F5"/>
                                    <circle cx="16" cy="13" r="7" fill="#EB001B"/>
                                    <circle cx="26" cy="13" r="7" fill="#F79E1B"/>
                                    <path d="M21 8C23.5 10 23.5 16 21 18C18.5 16 18.5 10 21 8Z" fill="#FF5F00"/>
                                </svg>
                            </div>

                            {/* American Express Logo */}
                            <div className="relative">
                                <svg width="42" height="26" viewBox="0 0 42 26" fill="none" className="drop-shadow-sm">
                                    <rect width="42" height="26" rx="4" fill="url(#amexGradient)"/>
                                    <defs>
                                        <linearGradient id="amexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" style={{stopColor: '#006FCF'}}/>
                                            <stop offset="100%" style={{stopColor: '#0D4F8C'}}/>
                                        </linearGradient>
                                    </defs>
                                    <text x="21" y="11" fontSize="5.5" fontWeight="800" fill="white" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.5">AMERICAN</text>
                                    <text x="21" y="18" fontSize="5.5" fontWeight="800" fill="white" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="0.5">EXPRESS</text>
                                </svg>
                            </div>

                            {/* More payment methods indicator */}
                            <div className="px-2.5 py-1 text-xs font-semibold bg-gray-50 text-gray-600 rounded-md border border-gray-200 shadow-sm">
                                +5
                            </div>
                        </div>
                    </div>

                    {paymentMethod === "credit-card" && (
                        <div className="mt-4">
                            <StripeCardInput
                                ref={cardRef}
                                onCardChange={setIsCardComplete}
                                isProcessing={isProcessing}
                                error={paymentError}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Billing Address */}
            {paymentMethod === "credit-card" && (
                <div className="flex items-start gap-3 py-2">
                    <Checkbox
                        checked={billingAddress}
                        onCheckedChange={(checked: boolean) => setBillingAddress(checked)}
                        className="mt-1"
                    />
                    <label className="text-sm text-gray-700">
                        Use shipping address as billing address
                    </label>
                </div>
            )}

            {/* PayPal */}
            <div
                className={`border rounded-lg ${paymentMethod === "paypal" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                    }`}
            >
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="paypal" id="paypal" />
                                <label htmlFor="paypal" className="cursor-pointer font-semibold text-sm">
                                    PayPal
                                </label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="flex items-center">
                        <svg width="80" height="24" viewBox="0 0 80 24" fill="none">
                            <text x="0" y="18" fontSize="16" fontWeight="bold" fill="#003087">PayPal</text>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Shop Pay */}
            <div
                className={`border rounded-lg ${paymentMethod === "shop-pay" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                    }`}
            >
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="shop-pay" id="shop-pay" />
                                <label htmlFor="shop-pay" className="cursor-pointer font-semibold text-sm flex items-center gap-2">
                                    Shop Pay
                                    <span className="text-xs text-gray-600 font-normal">
                                        Pay in full or in instalments
                                    </span>
                                </label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="font-bold text-sm" style={{ color: '#5A31F4' }}>
                        shop
                    </div>
                </div>
            </div>
        </div>
    )
}