"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Popular countries for Express Checkout testing
export const TEST_COUNTRIES = [
  { code: "US", name: "United States", currency: "USD", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", currency: "GBP", flag: "🇬🇧" },
  { code: "DE", name: "Germany", currency: "EUR", flag: "🇩🇪" },
  { code: "FR", name: "France", currency: "EUR", flag: "🇫🇷" },
  { code: "NL", name: "Netherlands", currency: "EUR", flag: "🇳🇱" },
  { code: "CA", name: "Canada", currency: "CAD", flag: "🇨🇦" },
  { code: "AU", name: "Australia", currency: "AUD", flag: "🇦🇺" },
  { code: "JP", name: "Japan", currency: "JPY", flag: "🇯🇵" },
  { code: "SG", name: "Singapore", currency: "SGD", flag: "🇸🇬" },
  { code: "BR", name: "Brazil", currency: "BRL", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", currency: "MXN", flag: "🇲🇽" },
  { code: "IN", name: "India", currency: "INR", flag: "🇮🇳" },
]

// Sample addresses for each country
export const SAMPLE_ADDRESSES: Record<string, any> = {
  US: {
    name: "John Smith",
    line1: "123 Main Street",
    city: "New York",
    state: "NY",
    postal_code: "10001",
    country: "US"
  },
  GB: {
    name: "Jane Doe",
    line1: "456 Oxford Street",
    city: "London",
    state: "",
    postal_code: "W1C 1DG",
    country: "GB"
  },
  DE: {
    name: "Hans Mueller",
    line1: "789 Berliner Straße",
    city: "Berlin",
    state: "",
    postal_code: "10115",
    country: "DE"
  },
  FR: {
    name: "Marie Dupont",
    line1: "321 Champs-Élysées",
    city: "Paris",
    state: "",
    postal_code: "75008",
    country: "FR"
  },
  NL: {
    name: "Jan de Vries",
    line1: "123 Damstraat",
    city: "Amsterdam",
    state: "",
    postal_code: "1012 JS",
    country: "NL"
  },
  CA: {
    name: "Mike Johnson",
    line1: "456 Queen Street",
    city: "Toronto",
    state: "ON",
    postal_code: "M5V 2T6",
    country: "CA"
  },
  AU: {
    name: "Sarah Wilson",
    line1: "789 Bourke Street",
    city: "Melbourne",
    state: "VIC",
    postal_code: "3000",
    country: "AU"
  },
  JP: {
    name: "Takeshi Yamamoto",
    line1: "123 Shibuya Street",
    city: "Shibuya-ku",
    state: "Tokyo",
    postal_code: "150-0002",
    country: "JP"
  },
  SG: {
    name: "Wei Chen",
    line1: "456 Orchard Road",
    city: "Singapore",
    state: "",
    postal_code: "238874",
    country: "SG"
  },
  BR: {
    name: "Carlos Silva",
    line1: "789 Avenida Paulista",
    city: "São Paulo",
    state: "SP",
    postal_code: "01310-100",
    country: "BR"
  },
  MX: {
    name: "Maria Garcia",
    line1: "321 Reforma Avenue",
    city: "Mexico City",
    state: "CDMX",
    postal_code: "06060",
    country: "MX"
  },
  IN: {
    name: "Raj Kumar",
    line1: "456 MG Road",
    city: "Bangalore",
    state: "Karnataka",
    postal_code: "560001",
    country: "IN"
  }
}

interface CountrySelectorProps {
  onCountryChange: (country: string, address: any, currency: string) => void
  disabled?: boolean
}

export function CountrySelector({ onCountryChange, disabled = false }: CountrySelectorProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>("US")

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode)
    const country = TEST_COUNTRIES.find(c => c.code === countryCode)
    if (country) {
      const address = SAMPLE_ADDRESSES[countryCode]
      onCountryChange(countryCode, address, country.currency)
    }
  }

  return (
    <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-blue-900">🌍 Regional Testing</h3>
          <p className="text-xs text-blue-700 mt-1">
            Test Express Checkout with different countries and payment methods
          </p>
        </div>
        <div className="text-xs text-blue-600">
          Current: {selectedCountry}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={selectedCountry}
          onValueChange={handleCountryChange}
          disabled={disabled}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select country for testing" />
          </SelectTrigger>
          <SelectContent>
            {TEST_COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <div>
                    <div className="font-medium">{country.name}</div>
                    <div className="text-xs text-gray-500">{country.currency}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log(`Testing Express Checkout for ${selectedCountry}:`)
            const country = TEST_COUNTRIES.find(c => c.code === selectedCountry)
            const address = SAMPLE_ADDRESSES[selectedCountry]
            console.log('Country:', country)
            console.log('Address:', address)
          }}
        >
          📋 Log Info
        </Button>
      </div>

      <div className="text-xs text-blue-600">
        <strong>Expected Payment Methods:</strong>
        <ul className="mt-1 space-y-1">
          {selectedCountry === "US" && (
            <>
              <li>• PayPal (✅)</li>
              <li>• Link (✅)</li>
              <li>• Apple Pay (❌ - Domain verification)</li>
              <li>• Google Pay (❌ - HTTPS required)</li>
            </>
          )}
          {selectedCountry === "GB" && (
            <>
              <li>• PayPal (✅)</li>
              <li>• Link (✅)</li>
              <li>• Apple Pay (❌ - Domain verification)</li>
              <li>• Google Pay (❌ - HTTPS required)</li>
            </>
          )}
          {(selectedCountry === "DE" || selectedCountry === "FR" || selectedCountry === "NL") && (
            <>
              <li>• PayPal (✅)</li>
              <li>• Link (✅)</li>
              <li>• Klarna (✅ - Popular in EU)</li>
              <li>• Apple Pay (❌ - Domain verification)</li>
            </>
          )}
          {(selectedCountry === "CA" || selectedCountry === "AU") && (
            <>
              <li>• PayPal (✅)</li>
              <li>• Link (✅)</li>
              <li>• Apple Pay (❌ - Domain verification)</li>
            </>
          )}
          {selectedCountry === "JP" && (
            <>
              <li>• PayPal (✅)</li>
              <li>• Link (✅)</li>
              <li>• Konbini (✅ - Japanese convenience stores)</li>
            </>
          )}
        </ul>
      </div>
    </div>
  )
}