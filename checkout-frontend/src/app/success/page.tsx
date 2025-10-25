"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

function SuccessPageContent() {
    const searchParams = useSearchParams()
    const [orderId, setOrderId] = useState<string | null>(null)
    const [paymentId, setPaymentId] = useState<string | null>(null)
    const [amount, setAmount] = useState<string | null>(null)
    const [currency, setCurrency] = useState<string | null>(null)
    const [status, setStatus] = useState<string | null>(null)
    const [customerEmail, setCustomerEmail] = useState<string | null>(null)
    const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
        const orderIdParam = searchParams.get('orderId')
        const paymentIdParam = searchParams.get('paymentId')
        const amountParam = searchParams.get('amount')
        const currencyParam = searchParams.get('currency')
        const statusParam = searchParams.get('status')
        const emailParam = searchParams.get('email')
        const paymentMethodParam = searchParams.get('paymentMethod')

        setOrderId(orderIdParam)
        setPaymentId(paymentIdParam)
        setAmount(amountParam)
        setCurrency(currencyParam?.toUpperCase() || 'USD')
        setStatus(statusParam)
        setCustomerEmail(emailParam)
        setPaymentMethod(paymentMethodParam || 'Credit Card')
    }, [searchParams])

    if (!isClient) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
                    <p className="text-gray-600">Thank you for your order.</p>
                </div>

                {/* Payment Details */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>

                    <div className="space-y-3">
                        {paymentId && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Payment ID:</span>
                                <span className="font-mono text-sm font-semibold text-gray-900">{paymentId}</span>
                            </div>
                        )}

                        {amount && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Amount Paid:</span>
                                <span className="text-lg font-bold text-green-600">{currency} {parseFloat(amount).toFixed(2)}</span>
                            </div>
                        )}

                        {status && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Status:</span>
                                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                            </div>
                        )}

                        {customerEmail && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Email:</span>
                                <span className="text-sm text-gray-900">{customerEmail}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Order Details */}
                {orderId && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Order ID:</span>
                            <span className="font-mono text-sm font-semibold text-gray-900">{orderId}</span>
                        </div>
                    </div>
                )}

                {/* Transaction Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Transaction Type:</span>
                            <span className="font-medium">Payment</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Payment Method:</span>
                            <span className="font-medium capitalize">{paymentMethod}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Processing Time:</span>
                            <span className="font-medium">{new Date().toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Link
                        href="/"
                        className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                        Return to Home
                    </Link>
                    <button
                        onClick={() => window.print()}
                        className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                        Print Receipt
                    </button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                        A confirmation email has been sent to your email address.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <SuccessPageContent />
        </Suspense>
    )
}