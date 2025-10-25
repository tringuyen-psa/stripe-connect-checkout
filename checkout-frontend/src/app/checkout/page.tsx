import { CheckoutPage } from "@/components/checkout-page"
import { StripeWrapper } from "@/components/stripe-wrapper"

export default function Checkout() {
    return (
        <StripeWrapper>
            <CheckoutPage />
        </StripeWrapper>
    )
}