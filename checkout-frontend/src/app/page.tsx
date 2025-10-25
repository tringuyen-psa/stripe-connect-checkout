"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Minus, Trash2, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useProducts, Product } from "@/context/ProductContext"

export default function Home() {
    const { products, addProduct, removeProduct, updateQuantity, getTotal } = useProducts()
    const [newProduct, setNewProduct] = useState({
        name: "",
        price: "",
        quantity: "1"
    })

    const handleAddProduct = () => {
        if (newProduct.name && newProduct.price && newProduct.quantity) {
            const product: Product = {
                id: Date.now().toString(),
                name: newProduct.name,
                price: parseFloat(newProduct.price),
                quantity: parseInt(newProduct.quantity)
            }
            addProduct(product)
            setNewProduct({ name: "", price: "", quantity: "1" })
        }
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--ag1-background-secondary)', fontFamily: 'Assistant, sans-serif' }}>
            {/* Header */}
            <div className="ag1-section-no-radius" style={{ borderBottom: '1px solid var(--ag1-border)' }}>
                <div className="ag1-container ag1-section-padding-vertical" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="text-center flex-1">
                        <svg className="w-8 h-8 mx-auto" viewBox="0 0 100 100" fill="none">
                            <text x="50" y="60" textAnchor="middle" fontSize="48" fontWeight="bold" fill="#1a5f3f">
                                ORDER
                            </text>
                        </svg>
                    </div>
                    <div className="w-20" />
                </div>
            </div>

            {/* Main Content */}
            <div className="ag1-container ag1-section-padding-large">
                <h1 className="ag1-headline">Order Input</h1>

                <div className="ag1-main" style={{ maxWidth: 'var(--ag1-max-width)', margin: '0 auto' }}>
                    {/* Product Input Form */}
                    <div className="space-y-6">
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">Add Product</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Product Name
                                    </label>
                                    <Input
                                        placeholder="Enter product name"
                                        value={newProduct.name}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        className="border-gray-300"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Price ($)
                                        </label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            step="0.01"
                                            value={newProduct.price}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProduct({ ...newProduct, price: e.target.value })}
                                            className="border-gray-300"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Quantity
                                        </label>
                                        <Input
                                            type="number"
                                            placeholder="1"
                                            min="1"
                                            value={newProduct.quantity}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                                            className="border-gray-300"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleAddProduct}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    disabled={!newProduct.name || !newProduct.price}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Product
                                </Button>
                            </div>
                        </div>

                        {/* Checkout Button */}
                        {products.length > 0 && (
                            <Link href="/checkout">
                                <Button className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3">
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Proceed to Checkout ({products.length} items)
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Product List */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold mb-4">Product List</h2>

                        {products.length === 0 ? (
                            <div className="bg-gray-50 rounded-lg p-8 text-center">
                                <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600">No products added yet</p>
                                <p className="text-sm text-gray-500 mt-2">Add products to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {products.map((product) => (
                                    <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                                <p className="text-sm text-gray-600">${product.price.toFixed(2)} each</p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center border border-gray-300 rounded">
                                                    <button
                                                        onClick={() => updateQuantity(product.id, product.quantity - 1)}
                                                        className="p-2 hover:bg-gray-100"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="px-3 py-1 min-w-[3rem] text-center">
                                                        {product.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(product.id, product.quantity + 1)}
                                                        className="p-2 hover:bg-gray-100"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <span className="font-semibold min-w-[5rem] text-right">
                                                    ${(product.price * product.quantity).toFixed(2)}
                                                </span>

                                                <button
                                                    onClick={() => removeProduct(product.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Total */}
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex justify-between items-center text-lg font-semibold">
                                        <span>Total:</span>
                                        <span>${getTotal().toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}