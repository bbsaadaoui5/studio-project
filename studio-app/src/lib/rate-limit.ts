/**
 * Rate limiting utilities for protecting sensitive operations
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
  blockDurationMs?: number; // How long to block after exceeding limit
}

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  blocked: boolean;
  blockExpiry?: number;
}

// In-memory store (for serverless, consider Redis or similar for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if an operation is rate limited
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remainingAttempts: number; resetAt?: Date; blockedUntil?: Date } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // No previous attempts
  if (!entry) {
    rateLimitStore.set(key, {
      attempts: 1,
      firstAttempt: now,
      blocked: false,
    });
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - 1,
      resetAt: new Date(now + config.windowMs),
    };
  }

  // Check if currently blocked
  if (entry.blocked && entry.blockExpiry) {
    if (now < entry.blockExpiry) {
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: new Date(entry.blockExpiry),
      };
    }
    // Block expired, reset
    rateLimitStore.delete(key);
    return checkRateLimit(key, config);
  }

  // Check if window has expired
  const windowExpired = now - entry.firstAttempt > config.windowMs;
  if (windowExpired) {
    rateLimitStore.set(key, {
      attempts: 1,
      firstAttempt: now,
      blocked: false,
    });
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - 1,
      resetAt: new Date(now + config.windowMs),
    };
  }

  // Increment attempts
  entry.attempts += 1;

  // Check if limit exceeded
  if (entry.attempts > config.maxAttempts) {
    const blockDuration = config.blockDurationMs || config.windowMs * 2;
    entry.blocked = true;
    entry.blockExpiry = now + blockDuration;
    rateLimitStore.set(key, entry);

    return {
      allowed: false,
      remainingAttempts: 0,
      blockedUntil: new Date(entry.blockExpiry),
    };
  }

  rateLimitStore.set(key, entry);
  return {
    allowed: true,
    remainingAttempts: config.maxAttempts - entry.attempts,
    resetAt: new Date(entry.firstAttempt + config.windowMs),
  };
}

/**
 * Clear rate limit for a key (e.g., after successful login)
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    const isExpired = now - entry.firstAttempt > 3600000; // 1 hour
    const blockExpired = entry.blocked && entry.blockExpiry && now > entry.blockExpiry;
    
    if (isExpired || blockExpired) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 15 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupRateLimitStore, 900000);
}

// Predefined rate limit configs
export const RateLimits = {
  LOGIN: { maxAttempts: 5, windowMs: 900000, blockDurationMs: 1800000 }, // 5 attempts per 15 min, block 30 min
  PAYMENT: { maxAttempts: 10, windowMs: 3600000 }, // 10 attempts per hour
  PAYROLL_GENERATION: { maxAttempts: 3, windowMs: 3600000 }, // 3 per hour
  API_GENERAL: { maxAttempts: 100, windowMs: 60000 }, // 100 per minute
  PASSWORD_RESET: { maxAttempts: 3, windowMs: 3600000, blockDurationMs: 7200000 }, // 3 per hour, block 2 hours
};
