# Stripe Cache Fix - Prevent Automatic Payment Calls on Page Refresh

## Problem
Mỗi khi F5 trang `/checkout`, ứng dụng tự động gọi Stripe API và khởi tạo các payment methods (Google Pay, Apple Pay, etc.) ngay cả khi người dùng chưa có ý định thanh toán.

## Root Cause
1. **Automatic API Call**: `useEffect` trong checkout page tự động gọi `createExpressCheckoutPayment` khi page load
2. **Stripe Elements Auto-Initialize**: Khi có `clientSecret`, Stripe Elements tự động load các payment methods
3. **No Caching**: Mỗi lần refresh đều gọi API mới, không có cơ chế cache

## Solution

### 1. User-Initiated Payment Intent Creation
- Chỉ tạo `clientSecret` khi người dùng click vào nút "Load Payment Options"
- Không tự động gọi API khi page load

### 2. Intelligent Caching System
- Cache `clientSecret` trong `sessionStorage` (30 phút)
- Cache key dựa trên nội dung giỏ hàng (products, quantities, total)
- Tự động cleanup cache đã expired

### 3. Two-Step Checkout Flow
**Step 1: Cart Review**
- Hiển thị giỏ hàng và tổng tiền
- Nút "Load Payment Options" để tải payment methods
- Không có Stripe Elements được tải ở bước này

**Step 2: Payment Options**
- Sau khi click nút, mới tạo `clientSecret` và load Stripe Elements
- Stripe Elements chỉ được mount khi cần thiết
- Có caching để tránh gọi API trùng lặp

## Files Modified

### 1. `/app/checkout/page.tsx`
- **Before**: Auto-create payment intent on page load
- **After**: User-initiated payment intent creation with caching
- Thêm state `shouldCreatePaymentIntent` để control flow
- Hiển thị cart summary trước khi load payment options

### 2. `/lib/stripe-cache.ts` (New)
- Utility class để quản lý Stripe cache
- Methods:
  - `generateCacheKey()` - Tạo cache key dựa trên cart
  - `getCachedClientSecret()` - Lấy cache nếu còn valid
  - `setCachedClientSecret()` - Lưu cache với timestamp
  - `clearExpiredCache()` - Cleanup cache expired
  - `getCacheStats()` - Debug cache statistics

### 3. `/components/cache-status.tsx` (New)
- Component hiển thị cache status (góc dưới bên phải)
- Cho phép xóa cache manually
- Debug cache statistics

## Benefits

### ✅ Fixes
- **No automatic Stripe calls on page refresh**
- **Google Pay/Apple Pay chỉ load khi cần**
- **Reduced API calls và costs**
- **Better user experience**

### ✅ Additional Benefits
- **Faster page loads** (cache hit)
- **Better error handling**
- **Debug tools cho cache**
- **Cleaner component separation**

## Usage

### For Users
1. Vào trang `/checkout` - thấy cart summary, không có Stripe calls
2. Click "Load Payment Options" - mới bắt đầu load Stripe Elements
3. Payment options appear (Google Pay, Apple Pay, etc.)
4. Proceed with payment

### For Developers
- Monitor cache logs trong browser console
- Use CacheStatus component để debug
- Cache automatically expires sau 30 phút
- Can manually clear cache via CacheStatus component

## Cache Logic
```javascript
// Cache key based on cart contents
const cacheKey = `stripe_client_secret_${hash(cartContents)}`

// Check cache first
const cached = StripeCache.getCachedClientSecret(cacheKey)
if (cached) {
    // Use cache, no API call
    setClientSecret(cached)
} else {
    // Create new payment intent and cache it
    const response = await apiClient.createExpressCheckoutPayment(...)
    StripeCache.setCachedClientSecret(cacheKey, response.clientSecret)
}
```

## Testing
1. Load `/checkout` page → không có Stripe calls
2. Click "Load Payment Options" → Stripe Elements loaded
3. Refresh page → sử dụng cache, không có API call mới
4. Modify cart → tạo cache entry mới
5. Cache expires sau 30 phút → tự động gọi API mới

## Browser Console Logs
```
📋 Using cached clientSecret (age: 45 seconds)
🔄 Creating Express Checkout payment intent (user initiated)
✅ Payment intent created and cached
📊 Cache stats: { total: 1, expired: 0, valid: 1 }
💾 ClientSecret cached successfully
```

This fix ensures that Stripe payment methods are only loaded when explicitly requested by the user, preventing unnecessary API calls and improving performance.