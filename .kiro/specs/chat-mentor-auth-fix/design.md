# Chat Mentor Authentication Fix - Bugfix Design

## Overview

The `/chat-mentor` endpoint returns a 403 Forbidden error when accessed by unauthenticated users, manifesting as a CORS error in the browser. The root cause is a multi-layered authentication and CORS configuration issue:

1. **Frontend lacks authentication guards**: The mentor page doesn't check if the user is authenticated before rendering
2. **API Gateway requires JWT for all methods**: The POST endpoint requires JWT authorization, but unauthenticated requests fail before CORS headers are returned
3. **OPTIONS preflight may require authorization**: If the OPTIONS method isn't explicitly configured to bypass the authorizer, CORS preflight fails
4. **Frontend doesn't handle 403 gracefully**: When authentication fails, the error appears as a CORS issue rather than an auth issue

The fix involves adding frontend authentication guards, ensuring OPTIONS requests bypass authorization, and improving error handling to redirect users to login when authentication fails.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when an unauthenticated user attempts to access the AI Mentor feature
- **Property (P)**: The desired behavior - unauthenticated users should be redirected to login, authenticated users should successfully send messages
- **Preservation**: Existing authenticated chat functionality that must remain unchanged by the fix
- **chatMentor()**: The API method in `frontend/lib/api.ts` that sends POST requests to `/chat-mentor`
- **AIChat component**: The React component in `frontend/components/ai-chat.tsx` that renders the chat interface
- **MentorPage**: The page component in `frontend/app/dashboard/mentor/page.tsx` that displays the AI Mentor feature
- **JWT Authorizer**: The API Gateway authorizer that validates JWT tokens for protected endpoints
- **CORS Preflight**: The OPTIONS request sent by browsers before cross-origin requests to check permissions

## Bug Details

### Fault Condition

The bug manifests when an unauthenticated user (no valid JWT token in localStorage) attempts to access the AI Mentor page and send a chat message. The system fails in multiple ways:

1. The frontend doesn't check authentication state before rendering the chat interface
2. When the user sends a message, the API request includes no Authorization header (or an invalid token)
3. API Gateway's JWT authorizer rejects the request with 403 Forbidden
4. The 403 response may not include proper CORS headers, causing the browser to show a CORS error
5. The OPTIONS preflight request may also require authorization, blocking CORS entirely

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { user: User | null, action: 'page_load' | 'send_message' }
  OUTPUT: boolean
  
  RETURN (input.user == null OR input.user.token_expired)
         AND input.action IN ['page_load', 'send_message']
         AND userAttemptingToAccessMentorFeature()
END FUNCTION
```

### Examples

- **Example 1**: User navigates to `/dashboard/mentor` without logging in → Page loads with chat interface → User types message and clicks send → 403 Forbidden with CORS error
- **Example 2**: User logs in, token expires after 1 hour → User navigates to `/dashboard/mentor` → User sends message → 403 Forbidden with CORS error
- **Example 3**: User clears localStorage → User navigates to `/dashboard/mentor` → Page loads normally → User sends message → 403 Forbidden with CORS error
- **Edge Case**: User has malformed token in localStorage → User sends message → 403 Forbidden (expected behavior after fix: redirect to login)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Authenticated users with valid JWT tokens must continue to successfully send chat messages to the AI Mentor
- The chat-mentor Lambda function must continue to return responses with proper CORS headers
- Token refresh mechanism for other API calls must continue to work as designed
- Logout functionality must continue to clear tokens and redirect to login
- Other protected routes with proper authentication guards must continue to function normally

**Scope:**
All inputs where the user IS authenticated with a valid JWT token should be completely unaffected by this fix. This includes:
- Successful chat message sending and receiving
- Chat history retrieval
- Navigation between dashboard pages while authenticated
- Token refresh on 401 responses for other endpoints

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Missing Frontend Authentication Guard**: The `MentorPage` component doesn't check `isAuthenticated` from the auth context before rendering
   - The page loads normally for unauthenticated users
   - The chat interface appears functional but fails when used
   - No redirect to login occurs

2. **OPTIONS Method Requires Authorization**: The API Gateway configuration may require JWT authorization for OPTIONS requests
   - The `defaultCorsPreflightOptions` in the RestApi doesn't automatically bypass authorizers
   - The `/chat-mentor` resource doesn't explicitly add an OPTIONS method without authorization
   - CORS preflight fails before the Lambda function can return CORS headers

3. **403 Response Missing CORS Headers**: When API Gateway returns 403 for authorization failure, it may not include CORS headers
   - The browser blocks the response due to CORS policy
   - The actual 403 error is hidden behind a CORS error message
   - Frontend error handling can't distinguish between CORS and auth failures

4. **No Frontend Error Handling for Auth Failures**: The `api.ts` client handles 401 (token refresh) but not 403 (forbidden)
   - 403 errors are thrown as generic API errors
   - No redirect to login occurs on authentication failure
   - Users see cryptic error messages instead of being prompted to log in

## Correctness Properties

Property 1: Fault Condition - Unauthenticated Access Redirects to Login

_For any_ user access where the bug condition holds (user is not authenticated or has expired token), the fixed application SHALL redirect the user to the login page before allowing interaction with the AI Mentor feature, preventing 403 errors from occurring.

**Validates: Requirements 2.1, 2.3, 2.4**

Property 2: Preservation - Authenticated Chat Functionality

_For any_ user access where the bug condition does NOT hold (user is authenticated with valid JWT token), the fixed application SHALL produce exactly the same behavior as the original application, preserving all chat functionality including message sending, receiving, and history retrieval.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct, we need to make changes in three areas:

**File 1**: `frontend/app/dashboard/mentor/page.tsx`

**Changes**:
1. **Add Authentication Guard**: Import `useAuth` hook and check authentication state
   - Add `const { isAuthenticated, isLoading } = useAuth()` at component start
   - Add `const router = useRouter()` for navigation
   - Add `useEffect` to redirect to login if not authenticated
   - Show loading state while checking authentication

**File 2**: `frontend/lib/api.ts`

**Changes**:
1. **Improve 403 Error Handling**: Add specific handling for 403 Forbidden responses
   - Check for 403 status code in the `request` method
   - Clear tokens and throw a specific authentication error
   - Allow components to catch and handle auth errors appropriately

2. **Ensure Authorization Header**: Verify that the Authorization header is always included when token exists
   - Already implemented correctly, but verify in testing

**File 3**: `infrastructure/lib/codeflow-infrastructure-stack.ts`

**Changes**:
1. **Add Explicit OPTIONS Method**: Add OPTIONS method to `/chat-mentor` resource without authorizer
   - Use `chatMentorResource.addMethod('OPTIONS', ...)` with no authorizer
   - Configure proper CORS response headers
   - Ensure OPTIONS bypasses JWT authorization

2. **Add Gateway Responses for 403**: Configure API Gateway to return CORS headers on 403 responses
   - Add gateway response configuration for UNAUTHORIZED (403)
   - Include Access-Control-Allow-Origin and other CORS headers
   - Ensure browser can read the 403 error

**File 4**: `frontend/components/ai-chat.tsx`

**Changes**:
1. **Improve Error Handling**: Add specific handling for authentication errors
   - Check if error message indicates authentication failure
   - Provide user-friendly message suggesting login
   - Optionally trigger redirect to login from component

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Manually test the application with various authentication states and observe the behavior. Use browser DevTools to inspect network requests, CORS headers, and error messages. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Unauthenticated Access Test**: Clear localStorage, navigate to `/dashboard/mentor`, attempt to send message (will fail with CORS error on unfixed code)
2. **Expired Token Test**: Set an expired token in localStorage, navigate to `/dashboard/mentor`, attempt to send message (will fail with 403 on unfixed code)
3. **OPTIONS Preflight Test**: Use browser DevTools to observe OPTIONS request to `/chat-mentor` (may show 403 if authorizer is required on unfixed code)
4. **CORS Headers on 403 Test**: Observe 403 response headers in DevTools (may be missing CORS headers on unfixed code)

**Expected Counterexamples**:
- Browser console shows CORS error when sending chat message without authentication
- Network tab shows 403 Forbidden response for POST `/chat-mentor`
- OPTIONS request may also show 403 if authorizer is not bypassed
- No redirect to login occurs when authentication fails

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed application produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := accessMentorPage_fixed(input)
  ASSERT result.redirectedToLogin == true
  ASSERT result.corsErrorOccurred == false
  ASSERT result.userSeesAuthError == true
END FOR
```

**Test Cases**:
1. **Unauthenticated Redirect**: Clear localStorage → Navigate to `/dashboard/mentor` → Should redirect to `/auth/login`
2. **Expired Token Redirect**: Set expired token → Navigate to `/dashboard/mentor` → Should redirect to `/auth/login`
3. **OPTIONS Preflight Success**: Send OPTIONS request to `/chat-mentor` → Should return 200 with CORS headers, no authorization required
4. **403 with CORS Headers**: Force 403 by sending invalid token → Should receive 403 with proper CORS headers → Frontend should redirect to login

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed application produces the same result as the original application.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT accessMentorPage_original(input) = accessMentorPage_fixed(input)
  ASSERT sendChatMessage_original(input) = sendChatMessage_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all authenticated users

**Test Plan**: Observe behavior on UNFIXED code first for authenticated users, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Authenticated Chat Preservation**: Login with valid credentials → Navigate to `/dashboard/mentor` → Send multiple messages → Verify all messages are sent and responses received correctly
2. **Token Refresh Preservation**: Login → Wait for token to near expiration → Send message → Verify token refresh occurs and message is sent
3. **Navigation Preservation**: Login → Navigate between dashboard pages including mentor → Verify no unexpected redirects occur
4. **Logout Preservation**: Login → Navigate to mentor → Logout → Verify tokens cleared and redirect to login occurs

### Unit Tests

- Test authentication guard in MentorPage component (redirect when not authenticated)
- Test 403 error handling in API client (clear tokens and throw auth error)
- Test OPTIONS method configuration in API Gateway (no authorizer required)
- Test CORS headers on 403 responses from API Gateway

### Property-Based Tests

- Generate random authentication states (authenticated, unauthenticated, expired token) and verify correct behavior for each
- Generate random sequences of API calls with valid tokens and verify all succeed
- Generate random navigation patterns while authenticated and verify no unexpected redirects

### Integration Tests

- Test full flow: unauthenticated user → navigate to mentor → redirect to login → login → navigate to mentor → send message successfully
- Test token expiration flow: login → wait for expiration → attempt to send message → token refresh or redirect to login
- Test CORS preflight: send POST request from browser → verify OPTIONS preflight succeeds → verify POST request succeeds with valid token

