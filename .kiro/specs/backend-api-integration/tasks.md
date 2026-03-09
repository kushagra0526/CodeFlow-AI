# Implementation Plan: Backend API Integration

## Overview

This plan implements the integration of the Next.js frontend with the deployed AWS backend API. The implementation removes all mock data dependencies, adds robust error handling, implements caching and retry logic, and provides comprehensive offline support. The backend is already deployed at `https://n8e9ghd13g.execute-api.ap-south-1.amazonaws.com/dev`.

**Note:** The backend Lambda functions are already configured to use Amazon Nova Lite model (`apac.amazon.nova-lite-v1:0`) for all AI-powered features including chat mentor, learning path generation, and hint generation. No backend changes are needed for model configuration.

## Tasks

- [x] 1. Set up error handling infrastructure
  - [x] 1.1 Create error handler module with custom error classes
    - Implement APIError, NetworkError, TimeoutError, and ValidationError classes
    - Create handleAPIError function to transform errors
    - Create getErrorMessage function for user-friendly messages
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 1.2 Write property test for error classification
    - **Property 7: Client Error Message Display**
    - **Property 8: Server Error Generic Message**
    - **Validates: Requirements 9.1, 9.2**
  
  - [ ]* 1.3 Write unit tests for error handler
    - Test error type classification (network, timeout, 4xx, 5xx)
    - Test error message transformation
    - Test console logging behavior
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [x] 2. Create response validation module
  - [x] 2.1 Implement response validators for all API response types
    - Create validateAuthResponse function
    - Create validateProfileAnalysis function
    - Create validateLearningPath function
    - Create validateProgress function
    - Create validateChatResponse function
    - _Requirements: 14.1, 14.2, 14.3, 14.4_
  
  - [ ]* 2.2 Write property test for response validation
    - **Property 14: Response Validation**
    - **Validates: Requirements 14.1, 14.2, 14.3**
  
  - [ ]* 2.3 Write unit tests for validators
    - Test valid response acceptance
    - Test missing required fields detection
    - Test type mismatch detection
    - _Requirements: 14.1, 14.2, 14.3_

- [x] 3. Implement offline detection module
  - [x] 3.1 Create OfflineDetector class
    - Implement isOnline method using navigator.onLine
    - Implement subscribe/unsubscribe for online/offline events
    - Add event listeners for online/offline browser events
    - _Requirements: 15.1, 15.2, 15.3_
  
  - [ ]* 3.2 Write property test for offline request prevention
    - **Property 15: Offline Request Prevention**
    - **Validates: Requirements 15.4**
  
  - [ ]* 3.3 Write unit tests for offline detector
    - Test online/offline status detection
    - Test event listener registration
    - Test subscriber notification
    - _Requirements: 15.1, 15.2, 15.3_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Enhance API client with core request infrastructure
  - [x] 5.1 Add cache management to APIClient
    - Implement in-memory cache using Map<string, CacheEntry>
    - Add getCached, setCache, and invalidateCache methods
    - Implement cache key generation from endpoint and parameters
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [x] 5.2 Implement request timeout handling
    - Add AbortController support to request method
    - Implement configurable timeout (default 30s, 60s for long operations)
    - Throw TimeoutError when timeout occurs
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [x] 5.3 Implement retry logic with exponential backoff
    - Add retry loop for 5xx errors (max 3 attempts)
    - Implement exponential backoff (1s, 2s, 4s)
    - Skip retry for 4xx errors and mutation methods
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [x] 5.4 Integrate offline detection into request method
    - Check isOnline before making requests
    - Throw NetworkError if offline
    - _Requirements: 15.4_
  
  - [ ]* 5.5 Write property test for cache behavior
    - **Property 10: Cache Behavior for GET Requests**
    - **Property 11: Cache Invalidation on Mutations**
    - **Validates: Requirements 12.1, 12.4, 12.5**
  
  - [ ]* 5.6 Write property test for retry logic
    - **Property 12: No Retry for Client Errors**
    - **Property 13: No Retry for Mutation Methods**
    - **Validates: Requirements 13.3, 13.5**
  
  - [ ]* 5.7 Write unit tests for request infrastructure
    - Test timeout handling with AbortController
    - Test retry logic with exponential backoff
    - Test cache hit/miss scenarios
    - Test offline detection integration
    - _Requirements: 10.1, 10.2, 12.1, 13.1, 15.4_

- [x] 6. Implement authentication flow
  - [x] 6.1 Update login method to remove mock data
    - Remove USE_MOCK_DATA conditional logic
    - Call POST /auth/login endpoint
    - Store access_token and refresh_token in localStorage
    - Store user object in localStorage
    - Validate response using validateAuthResponse
    - _Requirements: 1.3, 3.1, 3.3, 14.1_
  
  - [x] 6.2 Update register method to remove mock data
    - Remove USE_MOCK_DATA conditional logic
    - Call POST /auth/register endpoint
    - Store tokens and user in localStorage
    - Validate response using validateAuthResponse
    - _Requirements: 1.3, 3.2, 3.3, 14.1_
  
  - [x] 6.3 Implement token refresh logic
    - Create refreshToken method to call POST /auth/refresh
    - Update access_token in localStorage on success
    - Clear tokens and redirect to login on failure
    - _Requirements: 3.4, 3.5_
  
  - [x] 6.4 Add Authorization header to authenticated requests
    - Modify request method to include "Bearer {token}" header
    - Skip header for auth endpoints (login, register)
    - _Requirements: 3.6_
  
  - [x] 6.5 Implement automatic token refresh on 401 errors
    - Detect 401 status in request method
    - Call refreshToken and retry request once
    - Clear tokens and redirect if refresh fails
    - _Requirements: 3.4, 3.5_
  
  - [ ]* 6.6 Write property test for token storage
    - **Property 3: Token Storage on Authentication**
    - **Validates: Requirements 3.3**
  
  - [ ]* 6.7 Write property test for authorization header
    - **Property 4: Authorization Header Inclusion**
    - **Validates: Requirements 3.6**
  
  - [ ]* 6.8 Write unit tests for authentication flow
    - Test login with valid credentials
    - Test register with new user
    - Test token storage and retrieval
    - Test token refresh on 401
    - Test redirect on refresh failure
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Integrate profile fetching endpoint
  - [x] 8.1 Update fetchProfile method to remove mock data
    - Remove USE_MOCK_DATA conditional logic
    - Call POST /scraping/fetch-profile endpoint
    - Send user_id and leetcode_username in request body
    - Set timeout to 60 seconds (long-running operation)
    - Mark as cacheable with 5-minute TTL
    - Validate response structure
    - _Requirements: 1.3, 4.1, 4.2, 10.4, 12.2_
  
  - [ ]* 8.2 Write property test for mock data exclusion
    - **Property 1: Mock Data Exclusion in Production**
    - **Validates: Requirements 1.3**
  
  - [ ]* 8.3 Write unit tests for profile fetching
    - Test successful profile fetch
    - Test error handling for failed fetch
    - Test loading state management
    - Test cache behavior
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 9. Integrate profile analysis endpoint
  - [x] 9.1 Update analyzeProfile method to remove mock data
    - Remove USE_MOCK_DATA conditional logic
    - Call POST /analyze/profile endpoint
    - Send user_id in request body
    - Mark as cacheable with 10-minute TTL
    - Validate response using validateProfileAnalysis
    - _Requirements: 1.3, 5.1, 12.3, 14.1_
  
  - [x] 9.2 Update getTopics method to remove mock data
    - Remove USE_MOCK_DATA conditional logic
    - Call GET /analyze/{user_id}/topics endpoint
    - Mark as cacheable with 10-minute TTL
    - _Requirements: 1.3, 5.1_
  
  - [ ]* 9.3 Write property test for topic classification
    - **Property 5: Topic Classification Mapping**
    - **Validates: Requirements 5.3**
  
  - [ ]* 9.4 Write unit tests for profile analysis
    - Test successful analysis fetch
    - Test topic proficiency display
    - Test heatmap visualization data
    - Test error when profile unavailable
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 10. Integrate learning path generation endpoint
  - [x] 10.1 Update generateLearningPath method to remove mock data
    - Remove USE_MOCK_DATA conditional logic
    - Call POST /recommendations/generate-path endpoint
    - Send weak_topics, strong_topics, proficiency_level in request body
    - Set timeout to 60 seconds (AI generation)
    - Invalidate cache after successful generation
    - Validate response structure
    - _Requirements: 1.3, 6.1, 6.2, 10.4, 12.5_
  
  - [x] 10.2 Implement getNextProblem method
    - Call GET /recommendations/next-problem endpoint
    - Send user_id and completed_problems as query parameters
    - Mark as cacheable with 5-minute TTL
    - _Requirements: 6.1_
  
  - [x] 10.3 Implement generateHint method
    - Call POST /recommendations/hint endpoint
    - Send problem_id and user_id in request body
    - Set timeout to 60 seconds (AI generation)
    - _Requirements: 6.1_
  
  - [ ]* 10.4 Write unit tests for learning path generation
    - Test successful path generation
    - Test problem display with all fields
    - Test marking problems as completed
    - Test error handling and retry
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 11. Integrate chat mentor endpoint
  - [x] 11.1 Verify chatMentor method implementation
    - Confirm POST /chat-mentor endpoint is called
    - Verify optional parameters (code, problem_id) are included when provided
    - Ensure timeout is set to 60 seconds
    - Validate response structure
    - _Requirements: 7.1, 7.2, 10.4_
  
  - [ ]* 11.2 Write property test for optional parameters
    - **Property 6: Optional Parameters Inclusion**
    - **Validates: Requirements 7.2**
  
  - [ ]* 11.3 Write unit tests for chat mentor
    - Test message sending
    - Test optional parameters inclusion
    - Test response display with metadata
    - Test loading state during request
    - Test error handling without clearing history
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 12. Integrate progress tracking endpoint
  - [x] 12.1 Update getProgress method to remove mock data
    - Remove USE_MOCK_DATA conditional logic
    - Call GET /progress/{user_id} endpoint
    - Mark as cacheable with 5-minute TTL
    - Validate response structure
    - _Requirements: 1.3, 8.1, 12.2_
  
  - [ ]* 12.2 Write unit tests for progress tracking
    - Test streak count display
    - Test badges display with earned dates
    - Test problems solved today and total
    - Test next milestone display
    - Test progress refresh after problem completion
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Remove mock data files and configuration
  - [x] 14.1 Delete mock-data.ts file
    - Remove frontend/lib/mock-data.ts
    - Verify no imports remain in codebase
    - _Requirements: 1.1, 1.2_
  
  - [x] 14.2 Remove USE_MOCK_DATA flag from API client
    - Remove all USE_MOCK_DATA conditional logic
    - Remove USE_MOCK_DATA constant definition
    - _Requirements: 1.3_
  
  - [x] 14.3 Update environment variable configuration
    - Create .env.local.example with NEXT_PUBLIC_API_URL
    - Document all required environment variables
    - Add URL validation for HTTPS requirement
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 14.4 Write property test for HTTPS validation
    - **Property 2: HTTPS URL Validation**
    - **Validates: Requirements 2.4**
  
  - [ ]* 14.5 Write unit tests for environment configuration
    - Test API URL reading from environment
    - Test default URL fallback
    - Test HTTPS validation
    - _Requirements: 2.1, 2.2, 2.4_

- [ ] 15. Implement UI components for loading and error states
  - [x] 15.1 Create useLoading hook
    - Implement loading state management
    - Implement error state management
    - Create execute function for async operations
    - _Requirements: 11.1, 11.2_
  
  - [ ] 15.2 Add loading indicators to all API-calling components
    - Add spinners to dashboard, profile, analysis, learning path pages
    - Disable action buttons during requests
    - Show global loading indicator for multiple concurrent requests
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ] 15.3 Add error display components
    - Create error message display component
    - Add retry buttons for failed requests
    - Preserve user input during errors (chat messages)
    - _Requirements: 9.1, 9.2, 9.3, 9.6_
  
  - [ ] 15.4 Add offline notification banner
    - Create offline banner component
    - Show banner when browser goes offline
    - Hide banner when browser comes back online
    - _Requirements: 15.1, 15.2, 15.3_
  
  - [ ]* 15.5 Write unit tests for UI components
    - Test loading state display
    - Test error message display
    - Test offline banner visibility
    - Test retry button functionality
    - _Requirements: 11.1, 11.2, 15.1, 15.2_

- [ ] 16. Add manual refresh and cache bypass functionality
  - [ ] 16.1 Implement manual refresh for cached data
    - Add refresh buttons to profile and analysis pages
    - Invalidate cache on manual refresh
    - Show loading state during refresh
    - _Requirements: 12.6_
  
  - [ ]* 16.2 Write unit tests for manual refresh
    - Test cache invalidation on refresh
    - Test loading state during refresh
    - Test data update after refresh
    - _Requirements: 12.6_

- [ ] 17. Integration testing and end-to-end validation
  - [ ]* 17.1 Write integration test for complete authentication flow
    - Test user registration → profile fetch → analysis → learning path
    - Test user login → dashboard load → progress display
    - _Requirements: 3.1, 3.2, 4.1, 5.1, 6.1, 8.1_
  
  - [ ]* 17.2 Write integration test for chat interaction flow
    - Test chat with code → hint generation
    - Test chat history preservation
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ]* 17.3 Write integration test for error recovery scenarios
    - Test network failure → offline banner → reconnect → retry
    - Test 500 error → retry 3 times → display error
    - Test 403 error → clear tokens → redirect to login
    - Test timeout → display message → allow retry
    - _Requirements: 9.2, 9.3, 10.2, 10.3, 13.1, 15.1, 15.2_
  
  - [ ]* 17.4 Write integration test for token refresh flow
    - Test token expiration → refresh → continue operation
    - Test refresh failure → clear tokens → redirect
    - _Requirements: 3.4, 3.5_

- [ ] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- The backend API is already deployed and live at the configured endpoint
- All API methods should use TypeScript for type safety
- MSW (Mock Service Worker) should be used for mocking HTTP requests in tests
