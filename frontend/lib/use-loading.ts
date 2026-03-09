// CodeFlow AI - useLoading Hook
// React hook for managing loading states and errors

'use client'

import { useState } from 'react'
import { APIError, handleAPIError, getErrorMessage } from './error-handler'

/**
 * Hook for managing loading states and errors during async operations
 */
export function useLoading() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<APIError | null>(null)

  /**
   * Execute an async operation with loading and error handling
   * @param promise The async operation to execute
   * @param onSuccess Optional callback on success
   * @param onError Optional callback on error
   * @returns The result of the operation or null if error
   */
  const execute = async <T>(
    promise: Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: APIError) => void
  ): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await promise
      onSuccess?.(result)
      return result
    } catch (err) {
      const apiError = handleAPIError(err)
      setError(apiError)
      onError?.(apiError)
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * Clear the current error
   */
  const clearError = () => {
    setError(null)
  }

  /**
   * Get user-friendly error message
   */
  const errorMessage = error ? getErrorMessage(error) : null

  return {
    loading,
    error,
    errorMessage,
    execute,
    clearError
  }
}
