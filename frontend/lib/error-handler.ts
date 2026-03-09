// CodeFlow AI - Error Handler
// Provides consistent error transformation and user-friendly messaging

/**
 * Base API Error class
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'APIError'
    Object.setPrototypeOf(this, APIError.prototype)
  }
}

/**
 * Network Error - connection failures
 */
export class NetworkError extends APIError {
  constructor(message: string = 'Network connection failed') {
    super(message)
    this.name = 'NetworkError'
    Object.setPrototypeOf(this, NetworkError.prototype)
  }
}

/**
 * Timeout Error - request exceeded time limit
 */
export class TimeoutError extends APIError {
  constructor(message: string = 'Request timed out') {
    super(message)
    this.name = 'TimeoutError'
    Object.setPrototypeOf(this, TimeoutError.prototype)
  }
}

/**
 * Validation Error - invalid response data
 */
export class ValidationError extends APIError {
  constructor(message: string, public fields?: string[]) {
    super(message)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * Transform various error types into APIError instances
 */
export function handleAPIError(error: unknown): APIError {
  // Already an APIError
  if (error instanceof APIError) {
    return error
  }

  // Network/fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NetworkError('Unable to connect to the server. Please check your internet connection.')
  }

  // Generic Error
  if (error instanceof Error) {
    return new APIError(error.message, undefined, error)
  }

  // Unknown error type
  return new APIError('An unexpected error occurred')
}

/**
 * Get user-friendly error message from APIError
 */
export function getErrorMessage(error: APIError): string {
  // Network errors
  if (error instanceof NetworkError) {
    return 'Unable to connect to the server. Please check your internet connection.'
  }

  // Timeout errors
  if (error instanceof TimeoutError) {
    return 'The request took too long. Please try again.'
  }

  // Validation errors
  if (error instanceof ValidationError) {
    return 'Received invalid data from server. Please try again.'
  }

  // Authentication errors (403)
  if (error.statusCode === 403) {
    return 'Your session has expired. Please log in again.'
  }

  // Server errors (5xx)
  if (error.statusCode && error.statusCode >= 500) {
    return 'Server error. Please try again later.'
  }

  // Client errors (4xx) - use the error message from API
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    return error.message || 'Invalid request. Please check your input.'
  }

  // Default message
  return error.message || 'An error occurred. Please try again.'
}

/**
 * Log error to console with detailed information
 */
export function logError(
  error: APIError,
  context?: {
    method?: string
    endpoint?: string
    params?: any
  }
): void {
  const timestamp = new Date().toISOString()
  
  console.error(`[APIError] ${timestamp}`)
  console.error(`  Type: ${error.name}`)
  if (error.statusCode) {
    console.error(`  Status: ${error.statusCode}`)
  }
  if (context?.method && context?.endpoint) {
    console.error(`  Endpoint: ${context.method} ${context.endpoint}`)
  }
  if (context?.params) {
    console.error(`  Parameters:`, context.params)
  }
  console.error(`  Message: ${error.message}`)
  if (error.originalError) {
    console.error(`  Original Error:`, error.originalError)
  }
  if (error.stack) {
    console.error(`  Stack:`, error.stack)
  }
}
