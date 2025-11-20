/**
 * Security utilities for input sanitization and validation
 * Protects against XSS, injection attacks, and malicious input
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes all HTML tags and dangerous characters
 */
export function sanitizeHTML(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitize Instagram caption
 * Allows emojis and special chars but prevents code injection
 */
export function sanitizeCaption(caption: string): string {
  if (!caption) return '';
  
  // Limit length (Instagram max is 2,200)
  let sanitized = caption.substring(0, 2200);
  
  // Remove null bytes and control characters except newlines
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Remove script tags and event handlers
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  return sanitized.trim();
}

/**
 * Sanitize hashtags
 * Only allows alphanumeric and underscore
 */
export function sanitizeHashtags(hashtags: string[] | string): string[] {
  const hashtagArray = typeof hashtags === 'string' 
    ? hashtags.split(',').map(h => h.trim())
    : hashtags;
  
  return hashtagArray
    .map(tag => tag.replace(/[^a-zA-Z0-9_]/g, '')) // Remove special chars
    .filter(tag => tag.length > 0 && tag.length <= 30) // Validate length
    .slice(0, 30); // Instagram limit
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate password strength
 * Returns error message or null if valid
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (password.length > 128) {
    return 'Password must be less than 128 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
}

/**
 * Sanitize file path to prevent directory traversal
 */
export function sanitizeFilePath(path: string): string {
  return path.replace(/\.\./g, '').replace(/[\/\\]/g, '');
}

/**
 * Validate URL
 */
export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize Drive folder ID
 * Only allows alphanumeric, dash, and underscore
 */
export function sanitizeDriveFolderId(folderId: string): string {
  return folderId.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 100);
}

/**
 * Rate limit tracker for client-side protection
 * Prevents rapid repeated requests
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Filter out old requests outside the time window
    const recentRequests = timestamps.filter(ts => now - ts < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return false; // Rate limit exceeded
    }
    
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    // Cleanup old entries periodically
    if (this.requests.size > 1000) {
      this.cleanup();
    }
    
    return true;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter(ts => now - ts < this.windowMs);
      if (recent.length === 0) {
        this.requests.delete(key);
      }
    }
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter(20, 60000); // 20 requests per minute

/**
 * Escape special characters for safe display
 */
export function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Validate date is in the future
 */
export function isValidFutureDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date > new Date() && !isNaN(date.getTime());
}

/**
 * Secure random string generator
 * Useful for generating tokens or IDs
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Content Security Policy helper
 * Returns recommended CSP headers
 */
export function getCSPDirectives(): Record<string, string> {
  return {
    'default-src': "'self'",
    'script-src': "'self' 'unsafe-inline' 'unsafe-eval'", // Vite requires unsafe-eval in dev
    'style-src': "'self' 'unsafe-inline'",
    'img-src': "'self' data: https:",
    'font-src': "'self' data:",
    'connect-src': "'self' http://localhost:3000",
    'frame-ancestors': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'",
  };
}
