"use client"

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { AlertCircle } from "lucide-react"

interface SimpleCardInputProps {
    onSubmit: (cardData: { number: string; expiry: string; cvc: string }) => void
    isProcessing: boolean
    error: string | null
}

export function SimpleCardInput({ onSubmit, isProcessing, error }: SimpleCardInputProps) {
    const [cardInput, setCardInput] = useState("")
    const [inputError, setInputError] = useState<string | null>(null)

    const parseCardInput = (input: string) => {
        // Split input by spaces, slashes, or other delimiters
        const parts = input.toLowerCase().split(/[\s\/\\|,-]+/).filter(part => part.trim())

        if (parts.length < 3) {
            return null
        }

        // Try to identify card number (usually the longest numeric sequence)
        let cardNumber = ""
        let expiry = ""
        let cvc = ""

        // Find card number (typically 13-19 digits)
        for (const part of parts) {
            const numbers = part.replace(/\D/g, '')
            if (numbers.length >= 13 && numbers.length <= 19) {
                cardNumber = numbers
                break
            }
        }

        // Find expiry (MM/YY or MM/YYYY format)
        for (const part of parts) {
            const match = part.match(/(\d{1,2})[\/\\-]?(\d{2,4})/)
            if (match) {
                let month = match[1].padStart(2, '0')
                let year = match[2]
                if (year.length === 2) {
                    year = '20' + year
                }
                expiry = `${month}/${year.slice(-2)}`
                break
            }
        }

        // Find CVC (typically 3-4 digits)
        for (const part of parts) {
            const numbers = part.replace(/\D/g, '')
            if (numbers.length >= 3 && numbers.length <= 4 && part !== cardNumber) {
                cvc = numbers
                break
            }
        }

        if (cardNumber && expiry && cvc) {
            return { number: cardNumber, expiry, cvc }
        }

        return null
    }

    const handleSubmit = () => {
        setInputError(null)

        const cardData = parseCardInput(cardInput)

        if (!cardData) {
            setInputError("Please enter card information in format: 4242424242424242 12/34 567")
            return
        }

        // Basic validation
        if (cardData.number.length < 13 || cardData.number.length > 19) {
            setInputError("Invalid card number")
            return
        }

        if (!cardData.expiry.match(/^\d{2}\/\d{2}$/)) {
            setInputError("Invalid expiry date (use MM/YY format)")
            return
        }

        if (cardData.cvc.length < 3 || cardData.cvc.length > 4) {
            setInputError("Invalid CVC")
            return
        }

        onSubmit(cardData)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className="space-y-4">
            {/* Single Card Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Information
                </label>
                <Input
                    placeholder="Enter card number, expiry, and CVC (e.g., 4242424242424242 12/34 567)"
                    value={cardInput}
                    onChange={(e) => {
                        setCardInput(e.target.value)
                        setInputError(null)
                    }}
                    onKeyPress={handleKeyPress}
                    className="border-gray-300"
                    disabled={isProcessing}
                />
                <p className="text-xs text-gray-500 mt-1">
                    Format: Card Number Expiry CVC (separated by spaces, slashes, or commas)
                </p>
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

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={isProcessing || !cardInput.trim()}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isProcessing ? (
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                    </div>
                ) : (
                    "Validate Card"
                )}
            </button>
        </div>
    )
}