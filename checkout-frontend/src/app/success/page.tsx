"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Package, User, CreditCard, MapPin } from "lucide-react"
import { apiClient } from "../../lib/api"

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
    const [orderData, setOrderData] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchOrderDetails = async () => {
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

            // Fetch detailed order data if we have an orderId
            if (orderIdParam) {
                setLoading(true)
                try {
                    const orderResponse = await apiClient.getOrder(orderIdParam)
                    if (orderResponse.data && !orderResponse.error) {
                        setOrderData(orderResponse.data)
                        console.log('Order data fetched:', orderResponse.data)
                    }
                } catch (error) {
                    console.error('Failed to fetch order details:', error)
                } finally {
                    setLoading(false)
                }
            }
        }

        fetchOrderDetails()
    }, [searchParams])

    if (!isClient) {
        return null
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading order details...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="text-2xl font-bold text-gray-900">
                            YourStore
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Need help?</span>
                            <Link href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                                Contact Support
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Order Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Success Header */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank you for your order!</h1>
                                <p className="text-gray-600 mb-6">
                                    We've received your order and will begin processing it right away.
                                </p>

                                {/* Order Number */}
                                {orderId && (
                                    <div className="bg-gray-50 rounded-lg p-4 inline-block">
                                        <p className="text-sm text-gray-600 mb-1">Order Number</p>
                                        <p className="font-mono font-semibold text-lg">#{orderId}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Status & Timeline */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">Payment Confirmed</p>
                                        <p className="text-sm text-gray-600">
                                            {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Package className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">Processing</p>
                                        <p className="text-sm text-gray-600">Your order is being prepared</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 opacity-50">
                                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">Shipped</p>
                                        <p className="text-sm text-gray-600">Tracking information will be available soon</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        {orderData?.items && orderData.items.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
                                <div className="space-y-4">
                                    {orderData.items.map((item: any, index: number) => (
                                        <div key={index} className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                                            <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <Package className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900">{item.name}</h3>
                                                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                                <p className="text-sm font-medium text-gray-900 mt-1">
                                                    ${((item.price * item.quantity) / 100).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment Information */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                                    <p className="font-medium capitalize">
                                        {orderData?.isExpressCheckout ? 'Express Checkout' : paymentMethod || 'Credit Card'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Payment ID</p>
                                    <p className="font-mono text-sm">{paymentId || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Status</p>
                                    <span className="inline-flex px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                                        Paid
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                                    <p className="font-bold text-lg text-green-600">
                                        {currency || 'USD'} {amount ? parseFloat(amount).toFixed(2) : '0.00'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Customer Info & Summary */}
                    <div className="space-y-6">
                        {/* Customer Information */}
                        {orderData?.customer && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <User className="w-5 h-5 text-gray-600" />
                                    <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Name</p>
                                        <p className="font-medium">
                                            {orderData.customer.firstName} {orderData.customer.lastName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="font-medium">{orderData.customer.email}</p>
                                    </div>
                                    {orderData.customer.phone && (
                                        <div>
                                            <p className="text-sm text-gray-600">Phone</p>
                                            <p className="font-medium">{orderData.customer.phone}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-gray-600">Shipping Address</p>
                                        <p className="font-medium text-sm">
                                            {orderData.customer.address}<br />
                                            {orderData.customer.city}, {orderData.customer.country} {orderData.customer.postalCode}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Order Summary */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                            <div className="space-y-3">
                                {orderData ? (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Subtotal</span>
                                            <span className="font-medium">${(orderData.subtotal / 100).toFixed(2)}</span>
                                        </div>
                                        {orderData.tax > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Tax</span>
                                                <span className="font-medium">${(orderData.tax / 100).toFixed(2)}</span>
                                            </div>
                                        )}
                                        {orderData.shipping > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Shipping</span>
                                                <span className="font-medium">${(orderData.shipping / 100).toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                                            <span className="text-gray-900">Total</span>
                                            <span className="text-green-600">${(orderData.total / 100).toFixed(2)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex justify-between text-lg font-bold">
                                        <span className="text-gray-900">Total Paid</span>
                                        <span className="text-green-600">
                                            {currency || 'USD'} {amount ? parseFloat(amount).toFixed(2) : '0.00'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <Link
                                href="/"
                                className="block w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors text-center"
                            >
                                Continue Shopping
                            </Link>
                            <button
                                onClick={() => window.print()}
                                className="block w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                            >
                                Print Receipt
                            </button>
                        </div>

                        {/* Help Section */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <h3 className="font-medium text-blue-900 mb-2">Need Help?</h3>
                            <p className="text-sm text-blue-700 mb-3">
                                If you have any questions about your order, don't hesitate to contact our support team.
                            </p>
                            <div className="space-y-2">
                                <a href="#" className="block text-sm font-medium text-blue-600 hover:text-blue-700">
                                    Email Support
                                </a>
                                <a href="#" className="block text-sm font-medium text-blue-600 hover:text-blue-700">
                                    View FAQ
                                </a>
                                <a href="#" className="block text-sm font-medium text-blue-600 hover:text-blue-700">
                                    Track Your Order
                                </a>
                            </div>
                        </div>
                    </div>
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