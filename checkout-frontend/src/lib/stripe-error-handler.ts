/**
 * Stripe Error Handler Utility
 *
 * This utility handles common browser extension communication errors
 * that occur with Stripe JavaScript SDK v8.x+
 */

export function setupStripeErrorHandler() {
  // Override console.error to filter out Stripe extension communication errors
  if (typeof window !== 'undefined') {
    const originalConsoleError = console.error;

    console.error = (...args: any[]) => {
      const message = args.join(' ');

      // Filter out common browser extension communication errors
      if (
        message.includes('Could not establish connection') ||
        message.includes('Receiving end does not exist') ||
        message.includes('runtime.lastError') ||
        message.includes('stripe') && message.includes('extension')
      ) {
        // Log as warning instead of error to reduce noise
        console.warn('[Stripe Extension Warning]', ...args);
        return;
      }

      // Call original console.error for other errors
      originalConsoleError.apply(console, args);
    };

    // Also handle unhandled runtime errors
    window.addEventListener('error', (event) => {
      if (
        event.message?.includes('Could not establish connection') ||
        event.message?.includes('Receiving end does not exist')
      ) {
        console.warn('[Suppressed Extension Error]', event.message);
        event.preventDefault();
        return false;
      }
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (
        event.reason?.message?.includes('Could not establish connection') ||
        event.reason?.message?.includes('Receiving end does not exist')
      ) {
        console.warn('[Suppressed Extension Promise Error]', event.reason?.message);
        event.preventDefault();
        return false;
      }
    });
  }
}

/**
 * Check if error is related to browser extension communication
 */
export function isExtensionError(error: any): boolean {
  if (!error) return false;

  const message = error.message || error.toString();
  return (
    message.includes('Could not establish connection') ||
    message.includes('Receiving end does not exist') ||
    message.includes('runtime.lastError')
  );
}

/**
 * Safely log Stripe errors without extension warnings
 */
export function logStripeError(error: any, context?: string) {
  if (isExtensionError(error)) {
    console.warn(`[Stripe Extension Error] ${context ? context + ': ' : ''}`, error);
    return;
  }

  console.error(`[Stripe Error] ${context ? context + ': ' : ''}`, error);
}