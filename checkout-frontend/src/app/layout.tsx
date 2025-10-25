import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ProductProvider } from '@/context/ProductContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Checkout System',
  description: 'A modern checkout system built with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className={inter.className}>
        <ProductProvider>
          {children}
        </ProductProvider>
      </body>
    </html>
  )
}