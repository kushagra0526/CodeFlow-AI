// CodeFlow AI - API Client
// Handles all backend API communication

import { 
  APIError, 
  NetworkError, 
  TimeoutError, 
  ValidationError,
  handleAPIError,
  logError 
} from './error-handler'
import { offlineDetector } from './offline-detector'
import {
  validateAuthResponse,
  validateProfileAnalysis,
  validateLearningPath,
  validateProgress,
  validateChatResponse,
  validateProfileFetchResponse,
  validateTopicsResponse
} from './response-validator'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://n8e9ghd13g.execute-api.ap-south-1.amazonaws.com/dev'

// Cache entry interface
interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

// Request configuration interface
interface RequestConfig {
  timeout?: number          // Default: 30000ms
  retryable?: boolean       // Default: true for GET, false for mutations
  maxRetries?: number       // Default: 3
  cacheable?: boolean       // Default: false
  cacheTTL?: number        // Default: 300000ms (5 minutes)
  skipAuthRefresh?: boolean // Default: false
  skipValidation?: boolean  // Default: false
}

// Types
export interface User {
  user_id: string
  leetcode_username: string
  language_preference: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user?: User
  expires_in?: number
}

export interface TopicProficiency {
  proficiency: number
  classification: 'weak' | 'moderate' | 'strong'
}

export interface ProfileAnalysis {
  user_id: string
  topics: Record<string, TopicProficiency>
  heatmap: {
    weak: Array<{ name: string; proficiency: number }>
    moderate: Array<{ name: string; proficiency: number }>
    strong: Array<{ name: string; proficiency: number }>
  }
  summary: {
    total_topics: number
    weak_topics: number
    moderate_topics: number
    strong_topics: number
  }
}

export interface Problem {
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  topics: string[]
  leetcode_id: string
  estimated_time_minutes: number
  reason?: string
}

export interface LearningPath {
  path_id: string
  problems: Problem[]
  total_problems: number
  weak_topics_targeted: string[]
  created_at: string
}

export interface Badge {
  badge_id: string
  name: string
  earned_at: string
  milestone: number
}

export interface Progress {
  user_id: string
  streak_count: number
  badges: Badge[]
  problems_solved_today: number
  total_problems_solved: number
  last_solve_timestamp: string | null
  next_milestone: {
    days: number
    badge_name: string
    days_remaining: number
  } | null
}

export interface ChatResponse {
  response: string
  intent: 'CODE_DEBUGGING' | 'CONCEPT_QUESTION' | 'HINT_REQUEST' | 'GENERAL'
  cached: boolean
  model_used: 'nova-lite'
}

// API Client Class
class APIClient {
  private baseURL: string
  private accessToken: string | null = null
  private cache: Map<string, CacheEntry> = new Map()

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token')
    }
  }

  // Set authentication token
  setToken(token: string) {
    this.accessToken = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token)
    }
  }

  // Clear authentication token
  clearToken() {
    this.accessToken = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    }
  }

  // Cache management
  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      // Cache expired
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  private invalidateCache(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  private generateCacheKey(method: string, endpoint: string, params?: any): string {
    const paramsStr = params ? JSON.stringify(params) : ''
    return `${method}:${endpoint}:${paramsStr}`
  }

  // Generic request method with timeout, retry, and caching
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      timeout = 30000,
      retryable = options.method === 'GET' || !options.method,
      maxRetries = 3,
      cacheable = false,
      cacheTTL = 300000, // 5 minutes
      skipAuthRefresh = false,
      skipValidation = false
    } = config

    // Check if online
    if (!offlineDetector.isOnline()) {
      const error = new NetworkError('You are currently offline. Please check your internet connection.')
      logError(error, { method: options.method as string, endpoint })
      throw error
    }

    // Check cache for GET requests
    if (cacheable && (!options.method || options.method === 'GET')) {
      const cacheKey = this.generateCacheKey(options.method || 'GET', endpoint, options.body)
      const cached = this.getCached<T>(cacheKey)
      if (cached) {
        return cached
      }
    }

    const url = `${this.baseURL}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    console.log('[API] Making request:', {
      method: options.method || 'GET',
      url,
      endpoint,
      hasToken: !!this.accessToken
    })

    // Add auth token if available (skip for auth endpoints)
    if (this.accessToken && !endpoint.includes('/auth/')) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
      console.log('[API] Adding Authorization header for:', endpoint)
      console.log('[API] Token (first 20 chars):', this.accessToken.substring(0, 20) + '...')
    } else if (!endpoint.includes('/auth/')) {
      console.log('[API] No access token available for:', endpoint)
    }

    let lastError: Error | null = null
    let attempt = 0

    while (attempt <= (retryable ? maxRetries : 0)) {
      try {
        // Create AbortController for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        try {
          const response = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          console.log('[API] Response received:', {
            status: response.status,
            statusText: response.statusText,
            endpoint
          })

          // Handle 403 - authentication failure
          if (response.status === 403) {
            this.clearToken()
            const error = new APIError('Your session has expired. Please log in again.', 403)
            logError(error, { method: options.method as string, endpoint })
            throw error
          }

          // Handle 401 - try to refresh token
          if (response.status === 401 && this.accessToken && !skipAuthRefresh) {
            const refreshed = await this.refreshToken()
            if (refreshed) {
              // Retry request with new token
              headers['Authorization'] = `Bearer ${this.accessToken}`
              const retryResponse = await fetch(url, { ...options, headers })
              
              if (!retryResponse.ok) {
                const errorData = await retryResponse.json().catch(() => ({ error: retryResponse.statusText }))
                const error = new APIError(errorData.error || `API Error: ${retryResponse.statusText}`, retryResponse.status)
                logError(error, { method: options.method as string, endpoint })
                throw error
              }
              
              const data = await retryResponse.json()
              
              // Cache successful GET responses
              if (cacheable && (!options.method || options.method === 'GET')) {
                const cacheKey = this.generateCacheKey(options.method || 'GET', endpoint, options.body)
                this.setCache(cacheKey, data, cacheTTL)
              }
              
              return data
            } else {
              this.clearToken()
              const error = new APIError('Session expired. Please log in again.', 401)
              logError(error, { method: options.method as string, endpoint })
              throw error
            }
          }

          // Handle 4xx errors (don't retry)
          if (response.status >= 400 && response.status < 500) {
            const errorData = await response.json().catch(() => ({ error: response.statusText }))
            const error = new APIError(errorData.error || `API Error: ${response.statusText}`, response.status)
            logError(error, { method: options.method as string, endpoint })
            throw error
          }

          // Handle 5xx errors (retry with exponential backoff)
          if (response.status >= 500) {
            const errorData = await response.json().catch(() => ({ error: response.statusText }))
            lastError = new APIError(errorData.error || 'Server error. Please try again later.', response.status)
            
            if (attempt < maxRetries && retryable) {
              // Exponential backoff: 1s, 2s, 4s
              const backoffMs = Math.pow(2, attempt) * 1000
              await new Promise(resolve => setTimeout(resolve, backoffMs))
              attempt++
              continue
            }
            
            logError(lastError as APIError, { method: options.method as string, endpoint })
            throw lastError
          }

          // Success response
          const data = await response.json()

          // Cache successful GET responses
          if (cacheable && (!options.method || options.method === 'GET')) {
            const cacheKey = this.generateCacheKey(options.method || 'GET', endpoint, options.body)
            this.setCache(cacheKey, data, cacheTTL)
          }

          // Invalidate cache for mutations
          if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method)) {
            // Invalidate related cache entries
            this.invalidateCache(endpoint.split('/')[1] || '')
          }

          return data

        } catch (fetchError: any) {
          clearTimeout(timeoutId)

          // Handle timeout
          if (fetchError.name === 'AbortError') {
            const error = new TimeoutError('The request took too long. Please try again.')
            logError(error, { method: options.method as string, endpoint })
            throw error
          }

          // Handle network errors
          if (fetchError instanceof TypeError) {
            lastError = new NetworkError('Unable to connect to the server. Please check your internet connection.')
            
            if (attempt < maxRetries && retryable) {
              const backoffMs = Math.pow(2, attempt) * 1000
              await new Promise(resolve => setTimeout(resolve, backoffMs))
              attempt++
              continue
            }
            
            logError(lastError as APIError, { method: options.method as string, endpoint })
            throw lastError
          }

          throw fetchError
        }

      } catch (error) {
        // If it's already an APIError, just throw it
        if (error instanceof APIError) {
          throw error
        }

        // Transform to APIError
        const apiError = handleAPIError(error)
        logError(apiError, { method: options.method as string, endpoint })
        throw apiError
      }
    }

    // If we exhausted all retries
    if (lastError) {
      throw lastError
    }

    throw new APIError('Request failed after multiple attempts')
  }

  // Authentication
  async register(
    leetcode_username: string,
    email: string,
    password: string,
    language_preference: string = 'en'
  ): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({
          leetcode_username,
          email,
          password,
          language_preference,
        }),
      },
      { skipAuthRefresh: true }
    )
    
    // Validate response
    const validatedResponse = validateAuthResponse(response)
    
    this.setToken(validatedResponse.access_token)
    if (typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', validatedResponse.refresh_token)
      if (validatedResponse.user) {
        localStorage.setItem('user', JSON.stringify(validatedResponse.user))
      }
    }
    
    return validatedResponse
  }

  async login(leetcode_username: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ leetcode_username, password }),
      },
      { skipAuthRefresh: true }
    )
    
    // Validate response
    const validatedResponse = validateAuthResponse(response)
    
    this.setToken(validatedResponse.access_token)
    if (typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', validatedResponse.refresh_token)
      if (validatedResponse.user) {
        localStorage.setItem('user', JSON.stringify(validatedResponse.user))
      }
    }
    
    return validatedResponse
  }

  async refreshToken(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false
      
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) return false

      const response = await this.request<{ access_token: string; expires_in: number }>(
        '/auth/refresh',
        {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken }),
        },
        { skipAuthRefresh: true }
      )

      this.setToken(response.access_token)
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  // Scraping
  async fetchProfile(
    user_id: string,
    leetcode_username: string
  ): Promise<{ message: string; user_id: string; leetcode_username: string; profile: any }> {
    const response = await this.request(
      '/scraping/fetch-profile',
      {
        method: 'POST',
        body: JSON.stringify({ user_id, leetcode_username }),
      },
      {
        timeout: 60000, // 60 seconds for long-running operation
        cacheable: true,
        cacheTTL: 300000 // 5 minutes
      }
    )
    
    // Validate response
    return validateProfileFetchResponse(response)
  }

  // Profile Analysis
  async analyzeProfile(
    user_id: string,
    leetcode_username: string
  ): Promise<ProfileAnalysis> {
    const response = await this.request<ProfileAnalysis>(
      '/analyze/profile',
      {
        method: 'POST',
        body: JSON.stringify({ user_id, leetcode_username }),
      },
      {
        cacheable: true,
        cacheTTL: 600000 // 10 minutes
      }
    )
    
    // Validate response
    return validateProfileAnalysis(response)
  }

  async getTopics(user_id: string): Promise<{ user_id: string; topics: Record<string, TopicProficiency> }> {
    const response = await this.request(
      `/analyze/${user_id}/topics`,
      {},
      {
        cacheable: true,
        cacheTTL: 600000 // 10 minutes
      }
    )
    
    // Validate response
    return validateTopicsResponse(response)
  }

  // Progress
  async getProgress(user_id: string): Promise<Progress> {
    const response = await this.request<Progress>(
      `/progress/${user_id}`,
      {},
      {
        cacheable: true,
        cacheTTL: 300000 // 5 minutes
      }
    )
    
    // Validate response
    return validateProgress(response)
  }

  // Chat Mentor
  async chatMentor(
    user_id: string,
    message: string,
    code?: string,
    problem_id?: string
  ): Promise<ChatResponse> {
    const body: any = {
      user_id,
      message
    }
    
    // Include optional parameters if provided
    if (code) body.code = code
    if (problem_id) body.problem_id = problem_id
    
    const response = await this.request<ChatResponse>(
      '/chat-mentor',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      {
        timeout: 60000 // 60 seconds for AI generation
      }
    )
    
    // Validate response
    return validateChatResponse(response)
  }

  // Recommendations
  async generateLearningPath(
    user_id: string,
    weak_topics?: string[],
    strong_topics?: string[],
    proficiency_level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ): Promise<LearningPath> {
    const response = await this.request<LearningPath>(
      '/recommendations/generate-path',
      {
        method: 'POST',
        body: JSON.stringify({
          user_id,
          weak_topics,
          strong_topics,
          proficiency_level,
        }),
      },
      {
        timeout: 60000 // 60 seconds for AI generation
      }
    )
    
    // Validate response
    return validateLearningPath(response)
  }

  async getNextProblem(user_id: string): Promise<{
    problem: Problem
    reason: string
    current_index: number
    total_problems: number
  }> {
    return this.request(
      `/recommendations/next-problem?user_id=${user_id}`,
      {},
      {
        cacheable: true,
        cacheTTL: 300000 // 5 minutes
      }
    )
  }

  async generateHint(
    problem_id: string,
    user_id: string,
    problem_description: string,
    hint_level: 1 | 2 | 3 = 1
  ): Promise<{ hint: string; hint_level: number; problem_id: string }> {
    return this.request(
      '/recommendations/hint',
      {
        method: 'POST',
        body: JSON.stringify({
          problem_id,
          user_id,
          problem_description,
          hint_level,
        }),
      },
      {
        timeout: 60000 // 60 seconds for AI generation
      }
    )
  }

  // Helper: Get current user from localStorage
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }

  // Helper: Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  // Helper: Check if online
  isOnline(): boolean {
    return offlineDetector.isOnline()
  }

  // Helper: Manual cache invalidation
  clearCache(pattern?: string): void {
    if (pattern) {
      this.invalidateCache(pattern)
    } else {
      this.cache.clear()
    }
  }
}

// Export singleton instance
export const api = new APIClient(API_URL)

// Export for use in components
export default api
