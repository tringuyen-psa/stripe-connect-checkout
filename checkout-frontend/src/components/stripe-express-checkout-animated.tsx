"use client"

import { useState, useEffect } from "react"
import { useStripe, useElements, ExpressCheckoutElement } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import { useProducts } from "@/context/ProductContext"
import {
    AppleIcon,
    ChromeIcon,
    CreditCardIcon
} from "lucide-react"

interface WalletOption {
    id: string
    name: string
    icon: React.ReactNode
    color: string
    description: string
}

const walletOptions: WalletOption[] = [
    {
        id: 'apple-pay',
        name: 'Apple Pay',
        icon: <AppleIcon className="w-5 h-5" />,
        color: 'black',
        description: 'Pay with Apple Pay'
    },
    {
        id: 'google-pay',
        name: 'Google Pay',
        icon: <ChromeIcon className="w-5 h-5" />,
        color: 'blue',
        description: 'Pay with Google Pay'
    },
      {
        id: 'card',
        name: 'Credit Card',
        icon: <CreditCardIcon className="w-5 h-5" />,
        color: 'gray',
        description: 'Pay with credit or debit card'
    }
]

interface AnimatedExpressCheckoutProps {
    customerEmail: string
    customerInfo: {
        name: string
        address: {
            line1: string
            line2?: string
            city: string
            state: string
            postal_code: string
            country: string
        }
    }
    onSuccess: (orderId: string, paymentId: string) => void
    onError: (error: string) => void
    disabled?: boolean
    clientSecret?: string
}

export function AnimatedExpressCheckout({
    customerEmail,
    customerInfo,
    onSuccess,
    onError,
    disabled = false,
    clientSecret
}: AnimatedExpressCheckoutProps) {
    const stripe = useStripe()
    const elements = useElements()
    const { getTotal, products } = useProducts()
    const [loading, setLoading] = useState(false)
    const [selectedWallet, setSelectedWallet] = useState<string>('')
    const [walletAnimation, setWalletAnimation] = useState<string>('')

    // Track payment method changes with animations
    useEffect(() => {
        if (stripe && elements) {
            // const expressCheckoutElement = elements.getElement('expressCheckout') as any
            // if (expressCheckoutElement) {
                // Payment method change handling temporarily disabled
                // expressCheckoutElement.on('paymentmethodchange', (event: any) => {
                //     const paymentMethod = event.value?.type
                //     if (paymentMethod) {
                //         setSelectedWallet(paymentMethod)
                //         setWalletAnimation(paymentMethod)
                //
                //         console.log('Payment method selected:', paymentMethod)
                //
                //         // Clear previous animations
                //         document.querySelectorAll('.wallet-option').forEach(btn => {
                //             btn.classList.remove('scale-105', 'ring-2', 'ring-blue-500', 'ring-green-500', 'ring-yellow-500')
                //         })
                //
                //         // Add new animation after delay
                //         setTimeout(() => {
                //             const button = document.querySelector(`[data-wallet="${paymentMethod}"]`)
                //             if (button) {
                //                 button.classList.add('scale-105', 'ring-2')
                //
                //                 // Add specific color ring based on wallet type
                //                 const colorMap: { [key: string]: string } = {
                //                     'apple-pay': 'ring-green-500',
                //                     'google-pay': 'ring-blue-500',
                //                     'paypal': 'ring-yellow-500',
                //                     'card': 'ring-gray-500'
                //                 }
                //                 button.classList.add(colorMap[paymentMethod] || 'ring-blue-500')
                //             }
                //         }, 100)
                //
                //         // Reset animation after effect
                //         setTimeout(() => {
                //             setWalletAnimation('')
                //         }, 2000)
                //     }
                // })
            // }
        }
    }, [stripe, elements, customerInfo])

    const handleConfirm = async (event: any) => {
        if (!stripe || !elements) {
            onError('Payment system not ready')
            return
        }

        setLoading(true)
        setWalletAnimation('')

        try {
            // Submit payment elements
            const { error: submitError } = await elements.submit()
            if (submitError) {
                onError(submitError.message || 'Payment submission failed')
                return
            }

            // Create payment intent for Express Checkout if we don't have a clientSecret
            if (!clientSecret) {
                const expressPaymentResponse = await apiClient.createExpressCheckoutPayment({
                    amount: getTotal(),
                    currency: 'usd',
                    customerEmail,
                    customerInfo: {
                        name: customerInfo.name,
                        email: customerEmail,
                        address: {
                            line1: customerInfo.address.line1,
                            line2: customerInfo.address.line2,
                            city: customerInfo.address.city,
                            state: customerInfo.address.state,
                            postal_code: customerInfo.address.postal_code,
                            country: customerInfo.address.country,
                        }
                    }
                })

                if (expressPaymentResponse.error || !expressPaymentResponse.data) {
                    throw new Error(expressPaymentResponse.error || 'Failed to create express checkout payment')
                }

                // We got a clientSecret, now we can confirm to payment
                const { client_secret, payment_intent_id } = expressPaymentResponse.data as any
                const paymentIntentId = payment_intent_id

                const { error } = await stripe.confirmPayment({
                    elements,
                    clientSecret: client_secret,
                    confirmParams: {
                        return_url: `${window.location.origin}/success`,
                    },
                    redirect: 'if_required',
                })

                if (error) {
                    console.error('Stripe confirmation error:', error)
                    onError(error.message || 'Payment failed')
                    return
                }
            } else {
                // Use existing clientSecret
                const { error } = await stripe.confirmPayment({
                    elements,
                    clientSecret,
                    confirmParams: {
                        return_url: `${window.location.origin}/success`,
                    },
                    redirect: 'if_required',
                })

                if (error) {
                    console.error('Stripe confirmation error:', error)
                    onError(error.message || 'Payment failed')
                    return
                }
            }

            // If we get here with no error and no redirect, payment was successful
            // Create order after successful payment
            const orderResponse = await apiClient.createOrder({
                paymentIntentId: 'pi_demo_' + Date.now(),
                items: products.map(p => ({
                    name: p.name,
                    price: p.price,
                    quantity: p.quantity
                })),
                customer: {
                    email: customerEmail,
                    firstName: customerInfo.name.split(' ')[0],
                    lastName: customerInfo.name.split(' ').slice(1).join(' '),
                    phone: '',
                    address: customerInfo.address.line1,
                    city: customerInfo.address.city,
                    country: customerInfo.address.country,
                    postalCode: customerInfo.address.postal_code,
                },
                subtotal: getTotal(),
                tax: 0,
                shipping: 0,
                total: getTotal(),
                currency: 'usd',
                isExpressCheckout: true,
            })

            if (orderResponse.error) {
                throw new Error(orderResponse.error || 'Failed to create order')
            }

            // Success - redirect to success page
            const orderId = (orderResponse.data as any)?.id
            const params = new URLSearchParams({
                orderId: orderId || 'unknown',
                paymentId: 'pi_demo_' + Date.now(),
                amount: (getTotal() / 100).toFixed(2),
                currency: 'usd',
                status: 'completed',
                email: customerEmail,
                paymentMethod: 'express-checkout'
            })

            window.location.href = '/success?' + params.toString()

        } catch (err) {
            console.error('Payment error:', err)
            onError(err instanceof Error ? err.message : 'Payment failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Payment Method</h2>
                <p className="text-gray-600">Select your preferred payment method to continue</p>
            </div>

            {/* Wallet Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {walletOptions.map((wallet) => (
                    <button
                        key={wallet.id}
                        data-wallet={wallet.id}
                        onClick={() => {
                            setSelectedWallet(wallet.id)
                            setWalletAnimation(wallet.id)

                            // Clear all animations
                            document.querySelectorAll('.wallet-option').forEach(btn => {
                                btn.classList.remove('scale-105', 'ring-2', 'ring-green-500', 'ring-blue-500', 'ring-yellow-500', 'ring-gray-500')
                            })

                            // Add animation to selected wallet
                            setTimeout(() => {
                                const button = document.querySelector(`[data-wallet="${wallet.id}"]`)
                                if (button) {
                                    button.classList.add('scale-105', 'ring-2')

                                    const colorMap: { [key: string]: string } = {
                                        'apple-pay': 'ring-green-500',
                                        'google-pay': 'ring-blue-500',
                                        'card': 'ring-gray-500'
                                    }
                                    button.classList.add(colorMap[wallet.id] || 'ring-blue-500')
                                }
                            }, 50)

                            // Reset animation after effect
                            setTimeout(() => setWalletAnimation(''), 1500)
                        }}
                        className={`wallet-option relative p-6 rounded-lg border-2 transition-all duration-300 ${
                            selectedWallet === wallet.id
                                ? 'border-blue-500 bg-blue-50 shadow-lg'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                        }`}
                    >
                        <div className="flex flex-col items-center space-y-3">
                            {/* Wallet Icon */}
                            <div className={`p-3 rounded-full transition-all duration-300 ${
                                selectedWallet === wallet.id
                                    ? 'bg-blue-100 scale-110'
                                    : 'bg-gray-100'
                            }`}>
                                <div className={`transition-all duration-300 ${
                                    walletAnimation === wallet.id ? 'animate-bounce' : ''
                                }`}>
                                    {wallet.icon}
                                </div>
                            </div>

                            {/* Wallet Name */}
                            <div className="text-center">
                                <h3 className="font-semibold text-gray-900 mb-1">{wallet.name}</h3>
                                <p className="text-sm text-gray-600">{wallet.description}</p>
                            </div>
                        </div>

                        {/* Selected Indicator */}
                        {selectedWallet === wallet.id && (
                            <div className="absolute top-2 right-2">
                                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg width="12" height="9" viewBox="0 0 12 9" fill="white">
                                        <path d="M1 4.5L4.5 7.5L11 2M10 6L4.5 11" stroke="white" strokeWidth="1.5" fill="none"/>
                                    </svg>
                                </div>
                            </div>
                        )}

                        {/* Ripple Effect */}
                        {walletAnimation === wallet.id && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-0 bg-blue-500 opacity-10 rounded-lg animate-ping"></div>
                                <div className="absolute inset-0 bg-blue-500 opacity-5 rounded-lg animate-ping animation-delay-200"></div>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Continue Button */}
            <div className="text-center">
                <Button
                    onClick={handleConfirm}
                    disabled={disabled || loading || !selectedWallet}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Processing Payment...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span>Pay with {walletOptions.find(w => w.id === selectedWallet)?.name || 'Selected Method'}</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="animate-pulse">
                                <path d="M8 7V14L16 9L12 15L8 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    )}
                </Button>

                {!selectedWallet && (
                    <p className="text-sm text-gray-500 mt-3">Please select a payment method to continue</p>
                )}
            </div>

            {/* Style for animations */}
            <style jsx>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                @keyframes ping {
                    75%, 100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                    0% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                .scale-105 {
                    transform: scale(1.05);
                }

                .scale-110 {
                    transform: scale(1.1);
                }

                .animate-bounce {
                    animation: bounce 0.6s ease-in-out;
                }

                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }

                .animate-ping {
                    animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
                }

                .animation-delay-200 {
                    animation-delay: 200ms;
                }

                .transition-all {
                    transition: all 0.3s ease;
                }
            `}</style>
        </div>
    )
}