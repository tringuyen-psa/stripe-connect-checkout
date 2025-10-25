"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { useProducts } from "@/context/ProductContext"
import Link from "next/link"

interface OrderItem {
    id: string
    name: string
    description: string
    price: number
    originalPrice?: number
    quantity: number
    badge?: string
    isGift?: boolean
}

export function OrderSummary() {
    const { products, getTotal } = useProducts()
    const [discountCode, setDiscountCode] = useState("")
    const [showMoreItems, setShowMoreItems] = useState(false)

    // Convert products to OrderItem format
    const items: OrderItem[] = products.map((product) => ({
        id: product.id,
        name: product.name,
        description: `${product.quantity} ${product.quantity === 1 ? 'item' : 'items'}`,
        price: product.price,
        quantity: product.quantity,
        badge: product.quantity.toString(),
    }))

    const subtotal = getTotal()

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
            {/* Products */}
            <div className="space-y-4 mb-6">
                {items.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">Your cart is empty</p>
                        <Link
                            href="/"
                            className="inline-block mt-2 text-blue-600 hover:text-blue-800 underline"
                        >
                            Add products to your order
                        </Link>
                    </div>
                ) : (
                    items.slice(0, showMoreItems ? items.length : 3).map((item) => (
                    <div key={item.id} className="flex gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                <span className="text-xl font-bold text-gray-700">
                                    {item.name.includes("Omega") ? "Ω3" :
                                        item.name.includes("D3") ? "D3" :
                                            item.name.includes("Travel") ? "AG1" : "AG1"}
                                </span>
                            </div>
                            {item.badge && (
                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                                    {item.badge}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-gray-900">{item.name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                            {item.isGift && (
                                <div className="mt-1 inline-flex items-center text-xs">
                                    <span className="text-gray-400">⭕</span>
                                    <span className="ml-1" style={{ color: '#1a5f3f' }}>WELCOME GIFT</span>
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="font-semibold text-sm">${item.price.toFixed(2)}</div>
                            {item.originalPrice && item.originalPrice > item.price && (
                                <div className="text-xs text-gray-400 line-through">${item.originalPrice.toFixed(2)}</div>
                            )}
                        </div>
                    </div>
                    ))
                )}

                {items.length > 3 && !showMoreItems && items.length > 0 && (
                    <button
                        onClick={() => setShowMoreItems(true)}
                        className="flex items-center justify-center gap-2 w-full py-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                        <ChevronDown className="w-4 h-4" />
                        <span>Scroll for more items</span>
                        <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                            {items.length - 3}
                        </span>
                    </button>
                )}
            </div>

            {/* Discount Code */}
            <div className="mb-6">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Discount code</label>
                <div className="flex gap-2">
                    <Input
                        placeholder="Enter code"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        className="flex-1 border-gray-300"
                    />
                    <Button
                        variant="outline"
                        className="px-6 border-gray-300 hover:bg-gray-50"
                    >
                        Apply
                    </Button>
                </div>
            </div>

            {/* Add to Subscription */}
            <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="font-semibold text-sm mb-3">Add to your subscription</h3>
                <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-sm">AG Omega3</p>
                        <p className="text-xs text-gray-500">$39.00</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-300 hover:bg-white"
                    >
                        Remove
                    </Button>
                </div>
            </div>

            {/* Add to Order */}
            {/* <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="font-semibold text-sm mb-3">Add to this order</h3>
                <div className="space-y-2">
                    <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-sm">AGZ</p>
                            <p className="text-xs text-gray-500">$99.00</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-300 hover:bg-white"
                        >
                            Add
                        </Button>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-sm">AGZ: Flavor Sampler (3ct)</p>
                            <p className="text-xs text-gray-500">$19.00</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-300 hover:bg-white"
                        >
                            Add
                        </Button>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-sm">AG Vitamin D3+K2</p>
                            <p className="text-xs text-gray-500">$29.00</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-300 hover:bg-white"
                        >
                            Add
                        </Button>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-sm">AG Omega3</p>
                            <p className="text-xs text-gray-500">$39.00</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-300 hover:bg-white"
                        >
                            Add
                        </Button>
                    </div>
                </div>
            </div> */}

            {/* Totals */}
            <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">
                        {items.length} items · ${subtotal.toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-500 text-xs">Enter shipping address</span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between items-start">
                    <span className="font-semibold text-lg">Total</span>
                    <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">USD</div>
                        <div className="font-bold text-xl">${subtotal.toFixed(2)}</div>
                    </div>
                </div>
                {/* {savings > 0 && (
                    <div
                        className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold"
                        style={{ backgroundColor: '#1a5f3f', color: 'white' }}
                    >
                        <span>💰</span>
                        <span>TOTAL SAVINGS ${savings.toFixed(2)}</span>
                    </div>
                )} */}
            </div>

            <p className="text-xs text-gray-500 text-center">
                This order has a recurring charge for multiple items.
            </p>
        </div>
    )
}