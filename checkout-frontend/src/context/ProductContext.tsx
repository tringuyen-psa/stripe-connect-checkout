"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export interface Product {
  id: string
  name: string
  price: number
  quantity: number
}

interface ProductContextType {
  products: Product[]
  addProduct: (product: Product) => void
  removeProduct: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearProducts: () => void
  getTotal: () => number
}

const ProductContext = createContext<ProductContextType | undefined>(undefined)

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "AG1 Monthly Subscription",
      price: 1.00,
      quantity: 1
    },
    {
      id: "2",
      name: "AG1 Travel Packs",
      price: 0.50,
      quantity: 1
    }
  ])

  const addProduct = (product: Product) => {
    const existingProduct = products.find(p => p.id === product.id)
    if (existingProduct) {
      updateQuantity(product.id, existingProduct.quantity + product.quantity)
    } else {
      setProducts([...products, product])
    }
  }

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(id)
    } else {
      setProducts(products.map(p =>
        p.id === id ? { ...p, quantity } : p
      ))
    }
  }

  const clearProducts = () => {
    setProducts([])
  }

  const getTotal = () => {
    return products.reduce((sum, product) => sum + (product.price * product.quantity), 0)
  }

  return (
    <ProductContext.Provider value={{
      products,
      addProduct,
      removeProduct,
      updateQuantity,
      clearProducts,
      getTotal
    }}>
      {children}
    </ProductContext.Provider>
  )
}

export function useProducts() {
  const context = useContext(ProductContext)
  if (context === undefined) {
    throw new Error("useProducts must be used within a ProductProvider")
  }
  return context
}